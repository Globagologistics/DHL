import { brandConfig } from '../../config/brand';
import { environment } from '../../config/environment';
import type { EmailSettings, NotificationPreferences, PublicAppSettings, SettingsKey, SettingsValueMap, WhatsAppSettings } from './types';

const fallbackWhatsApp = environment.whatsappFallbackNumber.replace(/\D/g, '');

export const defaultApplicationSettings: PublicAppSettings = {
  businessDisplayName: brandConfig.appName,
  supportDisplayName: brandConfig.supportName,
  defaultCountry: 'United States',
  defaultTimezone: 'America/New_York',
  dateFormat: 'locale',
  supportAvailabilityLabel: 'Support available 24/7',
};

export const defaultWhatsAppSettings: WhatsAppSettings = {
  enabled: Boolean(fallbackWhatsApp),
  // A fallback number is treated as a full international number (country code included).
  countryCode: '',
  number: fallbackWhatsApp,
  displayLabel: 'WhatsApp Support',
  defaultMessage: 'Hello, I need assistance with a shipment.',
  trackingMessageTemplate: 'Hello, I need assistance with shipment {trackingId}.',
};

export const defaultNotificationPreferences: NotificationPreferences = {
  emailEnabled: true,
  categories: {
    shipmentCreated: true,
    shipmentUpdated: true,
    inTransit: true,
    outForDelivery: true,
    delivered: true,
    shipmentRequestSubmitted: true,
    customerSupportMessage: true,
    adminNotification: true,
  },
};

export const defaultEmailSettings: EmailSettings = {
  enabled: false,
  provider: 'gmail',
  senderName: brandConfig.appName,
  senderEmail: '',
  smtpUsername: '',
  adminNotificationEmail: '',
  host: '',
  port: 465,
  encryption: 'ssl',
};

export const settingsDefaults: { [K in SettingsKey]: SettingsValueMap[K] } = {
  application: defaultApplicationSettings,
  whatsapp: defaultWhatsAppSettings,
  notification_preferences: defaultNotificationPreferences,
  email: defaultEmailSettings,
};
