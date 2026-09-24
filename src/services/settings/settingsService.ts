import { readSettings, writeSettings } from './settingsStore';
import type { PublicAppSettings } from '../../features/settings/types';

export const getApplicationSettings = (options?: { fresh?: boolean }) => readSettings('application', options);

export function validateApplicationSettings(value: PublicAppSettings): string | null {
  if (!value.businessDisplayName.trim()) return 'Business display name is required.';
  if (!value.supportDisplayName.trim()) return 'Support display name is required.';
  if (value.businessDisplayName.length > 80 || value.supportDisplayName.length > 80) return 'Display names must be 80 characters or fewer.';
  try { new Intl.DateTimeFormat('en-US', { timeZone: value.defaultTimezone }); } catch { return 'Choose a valid timezone.'; }
  if (value.supportAvailabilityLabel.length > 80) return 'Availability label must be 80 characters or fewer.';
  return null;
}

export async function saveApplicationSettings(value: PublicAppSettings) {
  const issue = validateApplicationSettings(value);
  if (issue) throw new Error(issue);
  return writeSettings('application', {
    ...value,
    businessDisplayName: value.businessDisplayName.trim(),
    supportDisplayName: value.supportDisplayName.trim(),
    supportAvailabilityLabel: value.supportAvailabilityLabel.trim(),
  });
}
