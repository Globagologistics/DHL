import { readSettings, writeSettings } from './settingsStore';
import type { WhatsAppSettings } from '../../features/settings/types';

export const getWhatsAppSettings = (options?: { fresh?: boolean }) => readSettings('whatsapp', options);

/** Full international number, digits only (country code + national number). */
export function whatsappDestination(settings: WhatsAppSettings): string {
  const country = settings.countryCode.replace(/\D/g, '');
  const nationalDigits = settings.number.replace(/\D/g, '');
  // With a separate country code, drop the national trunk prefix (UK 07… → 7…).
  const national = country ? nationalDigits.replace(/^0+/, '') : nationalDigits;
  return `${country}${national}`;
}

export const isWhatsAppAvailable = (settings: WhatsAppSettings) => settings.enabled && whatsappDestination(settings).length >= 8;

export function whatsappMessage(settings: WhatsAppSettings, trackingId?: string | null): string {
  const id = trackingId?.trim();
  if (id && settings.trackingMessageTemplate.includes('{trackingId}')) return settings.trackingMessageTemplate.replaceAll('{trackingId}', id);
  return settings.defaultMessage;
}

/**
 * Standard click-to-chat link. wa.me opens the WhatsApp app on phones and
 * WhatsApp Web / Desktop on computers.
 */
export function buildWhatsAppLink(settings: WhatsAppSettings, trackingId?: string | null): string | null {
  if (!isWhatsAppAvailable(settings)) return null;
  const text = whatsappMessage(settings, trackingId);
  return `https://wa.me/${whatsappDestination(settings)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function validateWhatsAppSettings(value: WhatsAppSettings): string | null {
  const country = value.countryCode.replace(/\D/g, '');
  const national = value.number.replace(/\D/g, '');
  if (value.countryCode.trim() && !/^\+?\d{1,4}$/.test(value.countryCode.trim())) return 'Country code must be 1–4 digits, for example +1 or +44.';
  if (value.number.trim() && !/^[\d\s()-]+$/.test(value.number.trim())) return 'WhatsApp number may contain digits, spaces, brackets and dashes only.';
  if (value.enabled) {
    if (!national) return 'Enter the WhatsApp number before enabling WhatsApp Support.';
    const total = `${country}${national}`.length;
    if (total < 8 || total > 15) return 'The full international number must be 8–15 digits including the country code.';
  }
  if (!value.displayLabel.trim()) return 'Display label is required.';
  if (value.defaultMessage.length > 500 || value.trackingMessageTemplate.length > 500) return 'Messages must be 500 characters or fewer.';
  return null;
}

export async function saveWhatsAppSettings(value: WhatsAppSettings) {
  const issue = validateWhatsAppSettings(value);
  if (issue) throw new Error(issue);
  return writeSettings('whatsapp', {
    ...value,
    countryCode: value.countryCode.replace(/\D/g, ''),
    number: value.number.replace(/\D/g, ''),
    displayLabel: value.displayLabel.trim(),
    defaultMessage: value.defaultMessage.trim(),
    trackingMessageTemplate: value.trackingMessageTemplate.trim(),
  });
}
