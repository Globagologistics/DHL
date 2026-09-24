import { supabase } from '../../lib/supabase';
import { environment, hasBackendConfiguration } from '../../config/environment';
import { readSettings, writeSettings } from './settingsStore';
import { getWhatsAppSettings, isWhatsAppAvailable, whatsappDestination } from './whatsappConfigService';
import type { EmailConfigurationStatus, EmailCredentialSubmission, EmailSettings, IntegrationStatusItem } from '../../features/settings/types';

/**
 * Email/SMTP and integration status.
 *
 * Non-secret email fields (provider, sender, username) are ordinary settings.
 * The app password is WRITE-ONLY: it is posted once to the authenticated
 * `admin-settings` server function and is never stored in the browser,
 * returned by any API, or kept in component state after submission.
 */

const ADMIN_SETTINGS_ENDPOINT = `${environment.serverFunctionsBase}/admin-settings`;
// Development mock only records THAT a credential was submitted, never the value.
const DEV_EMAIL_STATUS_KEY = 'dhl-dev-email-credential-status';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ServerEndpointUnavailableError extends Error {
  constructor() { super('The secure settings endpoint is not running in this environment.'); }
}

async function callAdminSettings<T>(method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token as string | undefined;
  if (!token) throw new Error('Sign in with the administrator account to use this action.');
  let response: Response;
  try {
    response = await fetch(ADMIN_SETTINGS_ENDPOINT, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ServerEndpointUnavailableError();
  }
  // The Vite dev server answers unknown paths with index.html.
  if (response.status === 404 || !(response.headers.get('content-type') || '').includes('application/json')) throw new ServerEndpointUnavailableError();
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(payload.error || 'The settings service rejected the request.');
  return payload as T;
}

export const getEmailSettings = (options?: { fresh?: boolean }) => readSettings('email', options);

export function validateEmailSettings(settings: EmailSettings, appPassword?: string): string | null {
  if (!settings.senderName.trim()) return 'Sender name is required.';
  if (!EMAIL_PATTERN.test(settings.senderEmail.trim())) return 'Enter a valid sender email address.';
  if (!settings.smtpUsername.trim()) return settings.provider === 'gmail' ? 'Enter the Gmail account the app password belongs to.' : 'SMTP username is required.';
  if (settings.provider === 'gmail' && !EMAIL_PATTERN.test(settings.smtpUsername.trim())) return 'The Gmail SMTP account must be an email address.';
  if (settings.adminNotificationEmail.trim() && !EMAIL_PATTERN.test(settings.adminNotificationEmail.trim())) return 'Enter a valid admin notification email.';
  if (settings.provider === 'custom') {
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(settings.host.trim())) return 'Enter a valid SMTP host, for example smtp.example.com.';
    if (!Number.isInteger(settings.port) || settings.port < 1 || settings.port > 65535) return 'SMTP port must be between 1 and 65535.';
  }
  if (appPassword !== undefined) {
    const compact = appPassword.replace(/\s/g, '');
    if (!compact) return 'Enter the app password.';
    if (settings.provider === 'gmail' && !/^[a-z]{16}$/i.test(compact)) return 'A Google App Password is 16 letters (spaces are ignored). Do not use the Gmail account password.';
  }
  return null;
}

const normalizeEmailSettings = (settings: EmailSettings): EmailSettings => ({
  ...settings,
  senderName: settings.senderName.trim(),
  senderEmail: settings.senderEmail.trim(),
  smtpUsername: settings.smtpUsername.trim(),
  adminNotificationEmail: settings.adminNotificationEmail.trim(),
  host: settings.provider === 'gmail' ? 'smtp.gmail.com' : settings.host.trim(),
});

/** Saves the non-secret email fields (enabled flag, sender, provider…). */
export async function saveEmailSettings(settings: EmailSettings) {
  const issue = settings.enabled ? validateEmailSettings(settings) : null;
  if (issue) throw new Error(issue);
  return writeSettings('email', normalizeEmailSettings(settings));
}

function developmentEmailStatus(): EmailConfigurationStatus {
  let recorded: { credentialUpdatedAt: string } | null = null;
  try { recorded = JSON.parse(localStorage.getItem(DEV_EMAIL_STATUS_KEY) || 'null'); } catch { recorded = null; }
  return {
    state: recorded ? 'configured' : 'not_configured',
    credentialConfigured: Boolean(recorded),
    credentialUpdatedAt: recorded?.credentialUpdatedAt ?? null,
    source: 'development-mock',
    testEmailAvailable: false,
    credentialStorageAvailable: true,
    detail: 'Development mock: submitted passwords are discarded immediately. Nothing is stored or sent.',
  };
}

export async function getEmailConfigurationStatus(): Promise<EmailConfigurationStatus> {
  if (environment.settingsDevAdapter) return developmentEmailStatus();
  try {
    return await callAdminSettings<EmailConfigurationStatus>('GET');
  } catch (error) {
    if (error instanceof ServerEndpointUnavailableError) {
      return { state: 'not_configured', credentialConfigured: false, credentialUpdatedAt: null, source: 'unavailable', testEmailAvailable: false, credentialStorageAvailable: false, detail: 'The secure email endpoint is deployed with the Netlify server functions and is not reachable from this environment.' };
    }
    return { state: 'error', credentialConfigured: false, credentialUpdatedAt: null, source: 'unavailable', testEmailAvailable: false, credentialStorageAvailable: false, detail: error instanceof Error ? error.message : 'Email status could not be checked.' };
  }
}

/**
 * Sends the credential to the server once. The caller must clear its password
 * field afterwards; nothing here keeps a copy.
 */
export async function submitEmailCredential({ settings, appPassword }: EmailCredentialSubmission): Promise<EmailConfigurationStatus> {
  const issue = validateEmailSettings(settings, appPassword);
  if (issue) throw new Error(issue);
  const normalized = normalizeEmailSettings(settings);
  if (environment.settingsDevAdapter) {
    await writeSettings('email', normalized);
    localStorage.setItem(DEV_EMAIL_STATUS_KEY, JSON.stringify({ credentialUpdatedAt: new Date().toISOString() }));
    return developmentEmailStatus();
  }
  try {
    return await callAdminSettings<EmailConfigurationStatus>('POST', { action: 'save-email-credential', settings: normalized, appPassword: appPassword.replace(/\s/g, '') });
  } catch (error) {
    if (error instanceof ServerEndpointUnavailableError) throw new Error('The secure credential endpoint is not available here. Nothing was stored.');
    throw error;
  }
}

export async function sendTestEmail(): Promise<string> {
  if (environment.settingsDevAdapter) throw new Error('Available after email configuration. The development mock does not send email.');
  try {
    const result = await callAdminSettings<{ sentTo: string }>('POST', { action: 'test-email' });
    return `Test email sent to ${result.sentTo}.`;
  } catch (error) {
    if (error instanceof ServerEndpointUnavailableError) throw new Error('Available after email configuration. The server endpoint is not reachable here.');
    throw error;
  }
}

export type ManualNotification = { shipmentId: string; recipients: ('sender' | 'receiver')[]; subject: string; message: string };

/** Sends a one-off shipment email through the authenticated server function. */
export async function sendManualNotification(notification: ManualNotification): Promise<string> {
  if (environment.settingsDevAdapter) throw new Error('Available after email configuration. The development mock does not send email.');
  try {
    const result = await callAdminSettings<{ sent: number; failed: string[] }>('POST', { action: 'send-notification', ...notification });
    return result.failed.length ? `Sent ${result.sent}; delivery to the ${result.failed.join(' and ')} failed.` : `Notification sent to ${result.sent} recipient${result.sent === 1 ? '' : 's'}.`;
  } catch (error) {
    if (error instanceof ServerEndpointUnavailableError) throw new Error('Available after email configuration. The server notification endpoint is not reachable here.');
    throw error;
  }
}

export async function getIntegrationStatus(): Promise<IntegrationStatusItem[]> {
  const database = (async (): Promise<IntegrationStatusItem> => {
    if (!hasBackendConfiguration) return { key: 'database', label: 'Database', state: 'not_configured', detail: 'Public Supabase configuration is not set for this build.' };
    const { error } = await supabase.from('shipments').select('id').limit(1);
    return error
      ? { key: 'database', label: 'Database', state: 'error', detail: 'The database did not respond to a read request.' }
      : { key: 'database', label: 'Database', state: 'connected', detail: 'Shipment data is reachable.' };
  })();

  const storage = (async (): Promise<IntegrationStatusItem> => {
    const bucket = supabase.storage.from('shipment-images');
    if (!hasBackendConfiguration || typeof bucket.list !== 'function') return { key: 'storage', label: 'Storage', state: 'not_configured', detail: 'File storage is not configured for this build.' };
    const { error } = await bucket.list('', { limit: 1 });
    return error
      ? { key: 'storage', label: 'Storage', state: 'error', detail: `Storage responded with an error: ${error.message || 'unknown error'}.` }
      : { key: 'storage', label: 'Storage', state: 'connected', detail: 'Shipment image storage is reachable.' };
  })();

  const email = getEmailConfigurationStatus().then((status): IntegrationStatusItem => ({ key: 'email', label: 'Email', state: status.state, detail: status.detail }));

  const whatsapp = getWhatsAppSettings({ fresh: true }).then((record): IntegrationStatusItem => isWhatsAppAvailable(record.value)
    ? { key: 'whatsapp', label: 'WhatsApp', state: 'configured', detail: `Customers are routed to +${whatsappDestination(record.value)}.` }
    : { key: 'whatsapp', label: 'WhatsApp', state: 'not_configured', detail: record.value.enabled ? 'Enabled, but no valid number is set.' : 'WhatsApp Support is turned off.' });

  const notifications = (async (): Promise<IntegrationStatusItem> => {
    if (!hasBackendConfiguration) return { key: 'notifications', label: 'Notifications', state: 'not_configured', detail: 'Notification records need the database connection.' };
    const { data, error } = await supabase.from('notification_deliveries').select('delivery_status').order('created_at', { ascending: false }).limit(25);
    if (error) return { key: 'notifications', label: 'Notifications', state: 'error', detail: 'Delivery records could not be read.' };
    const rows = (data || []) as { delivery_status: string }[];
    const failed = rows.filter(row => row.delivery_status === 'failed').length;
    if (!rows.length) return { key: 'notifications', label: 'Notifications', state: 'connected', detail: 'Pipeline reachable. No deliveries recorded yet.' };
    return failed
      ? { key: 'notifications', label: 'Notifications', state: 'error', detail: `${failed} of the last ${rows.length} deliveries failed. Review Notification Center.` }
      : { key: 'notifications', label: 'Notifications', state: 'connected', detail: `Last ${rows.length} deliveries succeeded or are queued.` };
  })();

  const settled = await Promise.allSettled([database, email, whatsapp, notifications, storage]);
  const labels: [IntegrationStatusItem['key'], string][] = [['database', 'Database'], ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['notifications', 'Notifications'], ['storage', 'Storage']];
  return settled.map((result, index) => result.status === 'fulfilled'
    ? result.value
    : { key: labels[index][0], label: labels[index][1], state: 'error', detail: 'Status check failed.' });
}
