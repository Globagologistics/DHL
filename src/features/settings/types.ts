/**
 * Safe configuration types shared by Admin Settings and the services that read
 * configuration. No type returned to the browser carries a readable credential.
 */

export type IntegrationState = 'connected' | 'configured' | 'not_configured' | 'error';

export interface PublicAppSettings {
  businessDisplayName: string;
  supportDisplayName: string;
  defaultCountry: string;
  defaultTimezone: string;
  dateFormat: 'locale' | 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  supportAvailabilityLabel: string;
}

export interface WhatsAppSettings {
  enabled: boolean;
  /** Digits only, without "+" (for example "1" or "234"). */
  countryCode: string;
  /** National number, digits only. */
  number: string;
  displayLabel: string;
  defaultMessage: string;
  /** May contain {trackingId}. */
  trackingMessageTemplate: string;
}

export const notificationCategories = [
  'shipmentCreated',
  'shipmentUpdated',
  'inTransit',
  'outForDelivery',
  'delivered',
  'shipmentRequestSubmitted',
  'customerSupportMessage',
  'adminNotification',
] as const;
export type NotificationCategory = (typeof notificationCategories)[number];

export interface NotificationPreferences {
  emailEnabled: boolean;
  categories: Record<NotificationCategory, boolean>;
}

export type EmailProvider = 'gmail' | 'custom';
export type SmtpEncryption = 'ssl' | 'tls';

/** Non-secret email settings (admin-readable only). */
export interface EmailSettings {
  enabled: boolean;
  provider: EmailProvider;
  senderName: string;
  senderEmail: string;
  smtpUsername: string;
  adminNotificationEmail: string;
  /** Custom SMTP only; Gmail uses smtp.gmail.com with the port chosen server-side. */
  host: string;
  port: number;
  encryption: SmtpEncryption;
}

/** Returned by the server. Deliberately has no password field. */
export interface EmailConfigurationStatus {
  state: IntegrationState;
  credentialConfigured: boolean;
  credentialUpdatedAt: string | null;
  source: 'server-environment' | 'secure-store' | 'development-mock' | 'unavailable';
  testEmailAvailable: boolean;
  credentialStorageAvailable: boolean;
  detail: string;
}

/** Write-only. The app password is sent once to the server and never read back. */
export interface EmailCredentialSubmission {
  settings: EmailSettings;
  appPassword: string;
}

export interface AdminAccountSettings {
  email: string;
  pendingEmail: string | null;
  emailConfirmed: boolean;
  lastSignInAt: string | null;
  createdAt: string | null;
}

export type IntegrationKey = 'database' | 'email' | 'whatsapp' | 'notifications' | 'storage';

export interface IntegrationStatusItem {
  key: IntegrationKey;
  label: string;
  state: IntegrationState;
  detail: string;
}

export type SettingsKey = 'application' | 'whatsapp' | 'notification_preferences' | 'email';

export interface SettingsValueMap {
  application: PublicAppSettings;
  whatsapp: WhatsAppSettings;
  notification_preferences: NotificationPreferences;
  email: EmailSettings;
}

/** Where a settings value came from: the database, the dev-only browser store, or built-in defaults. */
export type SettingsSource = 'database' | 'development' | 'defaults';

export interface SettingsRecord<K extends SettingsKey> {
  value: SettingsValueMap[K];
  source: SettingsSource;
  updatedAt: string | null;
  /** False when no writable store is available (for example before the app_settings migration). */
  writable: boolean;
}
