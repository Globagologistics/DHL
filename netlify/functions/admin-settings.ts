import type { Handler, HandlerEvent } from '@netlify/functions';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

/**
 * Authenticated admin endpoint for settings that must not run in the browser.
 *
 *   GET                                  → email configuration status (never a secret)
 *   POST { action: 'test-email' }        → sends a test email to the signed-in admin
 *   POST { action: 'send-notification' } → sends a manual shipment email to sender/recipient
 *   POST { action: 'save-email-credential' } → 501 until secure storage exists (Part Two)
 *
 * Every request must carry the administrator's Supabase access token. SMTP
 * credentials are read from server environment variables only.
 */

type EmailStatus = {
  state: 'configured' | 'not_configured';
  credentialConfigured: boolean;
  credentialUpdatedAt: null;
  source: 'server-environment';
  testEmailAvailable: boolean;
  credentialStorageAvailable: false;
  detail: string;
};

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const safeError = (error: unknown) => String(error instanceof Error ? error.message : error)
  .replace(/(pass(word)?|auth|token)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
  .slice(0, 300);

const smtpConfigured = () => Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_APP_PASSWORD?.trim());

function emailStatus(): EmailStatus {
  const configured = smtpConfigured();
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  return {
    state: configured ? 'configured' : 'not_configured',
    credentialConfigured: configured,
    credentialUpdatedAt: null,
    source: 'server-environment',
    testEmailAvailable: configured,
    credentialStorageAvailable: false,
    detail: configured
      ? `Using the SMTP account configured in the server environment (${host}). Replacing it from the dashboard needs the secure credential store.`
      : 'No SMTP account is configured in the server environment yet.',
  };
}

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER?.trim(), pass: process.env.SMTP_APP_PASSWORD?.trim() },
  });
}

function serviceClient() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error('Server Supabase configuration is missing');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function authenticateAdmin(event: HandlerEvent, supabase: ReturnType<typeof serviceClient>) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await supabase.from('users').select('user_type').eq('id', data.user.id).single();
  return profile?.user_type === 'admin' ? data.user : null;
}

function brandedEmail({ heading, body, trackingNumber, actionUrl }: { heading: string; body: string; trackingNumber?: string; actionUrl?: string }) {
  const appName = process.env.APP_NAME?.trim() || 'DHL Express';
  const paragraphs = escapeHtml(body).split(/\n{2,}/).map(part => `<p style="margin:0 0 14px;line-height:1.55">${part.replace(/\n/g, '<br>')}</p>`).join('');
  const html = `<!doctype html><html><body style="margin:0;background:#f7f7f5;font-family:Arial,Helvetica,sans-serif;color:#1d1d1b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e7e8">
<tr><td style="background:#ffcc00;padding:18px 24px;font-weight:800;color:#d40511;font-size:18px">${escapeHtml(appName)}</td></tr>
<tr><td style="padding:26px 24px 8px"><h1 style="margin:0 0 16px;font-size:21px;line-height:1.25">${escapeHtml(heading)}</h1>${paragraphs}
${trackingNumber ? `<p style="margin:18px 0 0;font-size:12px;color:#62656a;letter-spacing:.08em;text-transform:uppercase">Tracking number</p><p style="margin:4px 0 0;font-size:18px;font-weight:800;letter-spacing:.06em">${escapeHtml(trackingNumber)}</p>` : ''}
${actionUrl ? `<p style="margin:22px 0 8px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#d40511;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">Track shipment</a></p>` : ''}
</td></tr><tr><td style="padding:16px 24px 22px;color:#85898f;font-size:11px">${escapeHtml(appName)} shipment support</td></tr></table></td></tr></table></body></html>`;
  const text = `${heading}\n\n${body}${trackingNumber ? `\n\nTracking number: ${trackingNumber}` : ''}${actionUrl ? `\n\nTrack shipment: ${actionUrl}` : ''}`;
  return { html, text };
}

const fromAddress = () => `${process.env.APP_NAME?.trim() || 'DHL Express'} <${process.env.SMTP_USER?.trim()}>`;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let supabase: ReturnType<typeof serviceClient>;
  try { supabase = serviceClient(); } catch (error) {
    console.error('admin-settings configuration error:', safeError(error));
    return json(500, { error: 'The settings service is not configured.' });
  }

  const admin = await authenticateAdmin(event, supabase).catch(() => null);
  if (!admin) return json(401, { error: 'Administrator sign-in required.' });

  if (event.httpMethod === 'GET') return json(200, emailStatus());

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }

  switch (body.action) {
    case 'save-email-credential':
      // Deliberately not stored anywhere yet. Part Two adds encrypted server-side
      // storage (Supabase Vault or equivalent) and reads it in the mail functions.
      return json(501, { error: 'Secure credential storage is set up during deployment (Part Two). Nothing was stored.' });

    case 'test-email': {
      if (!smtpConfigured()) return json(409, { error: 'Available after email configuration.' });
      if (!admin.email) return json(400, { error: 'The administrator account has no email address.' });
      try {
        const mailer = transport();
        const message = brandedEmail({ heading: 'Email is working', body: 'This is a test email from Admin Settings. Shipment notifications can be delivered with the current SMTP configuration.' });
        await mailer.sendMail({ from: fromAddress(), to: admin.email, subject: 'Test email from Admin Settings', ...message });
        mailer.close();
        return json(200, { sentTo: admin.email });
      } catch (error) {
        console.error('Test email failed:', safeError(error));
        return json(502, { error: 'The SMTP server rejected the test email. Check the account and app password.' });
      }
    }

    case 'send-notification': {
      if (!smtpConfigured()) return json(409, { error: 'Available after email configuration.' });
      const shipmentId = typeof body.shipmentId === 'string' ? body.shipmentId : '';
      const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const recipients = Array.isArray(body.recipients) ? body.recipients.filter((value): value is 'sender' | 'receiver' => value === 'sender' || value === 'receiver') : [];
      if (!shipmentId || !recipients.length || subject.length < 1 || subject.length > 150 || message.length < 1 || message.length > 4000) {
        return json(400, { error: 'Choose a shipment, at least one recipient, a subject (up to 150 characters) and a message (up to 4000 characters).' });
      }
      const { data: shipment, error } = await supabase.from('shipments').select('*').eq('id', shipmentId).single();
      if (error || !shipment) return json(404, { error: 'Shipment not found.' });
      const trackingNumber: string = shipment.tracking_number || shipment.id;
      const appUrl = (process.env.EMAIL_LINK_BASE_URL?.trim() || process.env.APP_URL?.trim() || '').replace(/\/$/, '');
      const actionUrl = appUrl ? `${appUrl}/track/${encodeURIComponent(trackingNumber)}` : undefined;
      const testRecipient = process.env.EMAIL_TEST_MODE?.trim().toLowerCase() === 'true' ? process.env.EMAIL_TEST_RECIPIENT?.trim() : undefined;
      const targets = recipients
        .map(role => ({ role, email: String((role === 'sender' ? shipment.sender_email : shipment.receiver_email) || '').trim() }))
        .filter(target => EMAIL_PATTERN.test(target.email));
      if (!targets.length) return json(400, { error: 'The selected recipients have no email address on file.' });

      const mailer = transport();
      const content = brandedEmail({ heading: subject, body: message, trackingNumber, actionUrl });
      let sent = 0;
      const failed: string[] = [];
      for (const target of targets) {
        try {
          await mailer.sendMail({ from: fromAddress(), to: testRecipient || target.email, subject: testRecipient ? `[TEST] ${subject}` : subject, ...content });
          sent += 1;
        } catch (sendError) {
          console.error('Manual notification failed:', safeError(sendError));
          failed.push(target.role);
        }
      }
      mailer.close();
      return json(failed.length && !sent ? 502 : 200, { sent, failed });
    }

    default:
      return json(400, { error: 'Unknown action.' });
  }
};
