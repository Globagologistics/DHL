import { useMemo } from 'react';
import { AppWindow } from 'lucide-react';
import { SaveBar, SettingsCard, SourceBadge, useSettingsForm } from '../SettingsPrimitives';
import type { PublicAppSettings } from '../types';
import { getApplicationSettings, saveApplicationSettings, validateApplicationSettings } from '../../../services/settings/settingsService';

const fallbackZones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Africa/Lagos', 'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney', 'UTC'];

function timeZones(current: string) {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ?? fallbackZones;
  return supported.includes(current) ? supported : [current, ...supported];
}

export function ApplicationSection() {
  const form = useSettingsForm(getApplicationSettings, saveApplicationSettings);
  const draft = form.draft;
  const zones = useMemo(() => timeZones(draft?.defaultTimezone || 'UTC'), [draft?.defaultTimezone]);
  if (!draft) return <SettingsCard id="application" icon={AppWindow} title="Application" description="Loading application settings…"><div className="dhl-settings-skeleton" /></SettingsCard>;
  const issue = validateApplicationSettings(draft);
  return <SettingsCard id="application" icon={AppWindow} title="Application" description="Display names and regional defaults. Infrastructure keys are deployment configuration and never appear here." badge={<SourceBadge record={form.record} />}>
    <div className="dhl-admin-form-grid">
      <label className="dhl-admin-form-field"><span>Business display name</span><input value={draft.businessDisplayName} onChange={event => form.update({ businessDisplayName: event.target.value })} /></label>
      <label className="dhl-admin-form-field"><span>Support display name</span><input value={draft.supportDisplayName} onChange={event => form.update({ supportDisplayName: event.target.value })} /></label>
      <label className="dhl-admin-form-field"><span>Default country</span><input value={draft.defaultCountry} onChange={event => form.update({ defaultCountry: event.target.value })} list="dhl-wizard-countries" /></label>
      <label className="dhl-admin-form-field"><span>Default timezone</span><select value={draft.defaultTimezone} onChange={event => form.update({ defaultTimezone: event.target.value })}>{zones.map(zone => <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>)}</select></label>
      <label className="dhl-admin-form-field"><span>Date format</span><select value={draft.dateFormat} onChange={event => form.update({ dateFormat: event.target.value as PublicAppSettings['dateFormat'] })}><option value="locale">Visitor’s locale</option><option value="dd/mm/yyyy">DD/MM/YYYY</option><option value="mm/dd/yyyy">MM/DD/YYYY</option><option value="yyyy-mm-dd">YYYY-MM-DD</option></select></label>
      <label className="dhl-admin-form-field"><span>Support availability label</span><input value={draft.supportAvailabilityLabel} onChange={event => form.update({ supportAvailabilityLabel: event.target.value })} placeholder="Support available 24/7" /></label>
    </div>
    <SaveBar dirty={form.dirty} saving={form.saving} disabled={!form.record?.writable || Boolean(issue)} disabledReason={!form.record?.writable ? 'Settings storage is created during deployment (app_settings migration).' : issue || undefined} onSave={() => void form.submit('Application settings saved.')} onReset={form.reset} feedback={form.feedback} />
  </SettingsCard>;
}
