import { ExternalLink } from 'lucide-react';
import { SaveBar, SettingsCard, SettingsSwitch, SourceBadge, useSettingsForm } from '../SettingsPrimitives';
import { WhatsAppIcon } from '../../whatsapp/WhatsAppSupport';
import { buildWhatsAppLink, getWhatsAppSettings, saveWhatsAppSettings, validateWhatsAppSettings, whatsappDestination, whatsappMessage } from '../../../services/settings/whatsappConfigService';

const SAMPLE_TRACKING = '1234 5678 9012';

export function WhatsAppSection() {
  const form = useSettingsForm(getWhatsAppSettings, saveWhatsAppSettings);
  const draft = form.draft;
  if (!draft) return <SettingsCard id="whatsapp" icon={WhatsAppIcon} title="WhatsApp Support" description="Loading WhatsApp settings…"><div className="dhl-settings-skeleton" /></SettingsCard>;
  const issue = validateWhatsAppSettings(draft);
  // Test links work from the unsaved draft so the number can be checked before saving.
  const previewSettings = { ...draft, enabled: true };
  const testLink = issue ? null : buildWhatsAppLink(previewSettings, SAMPLE_TRACKING);
  const openLink = issue ? null : buildWhatsAppLink(previewSettings);
  const destination = whatsappDestination(draft);
  return <SettingsCard id="whatsapp" icon={WhatsAppIcon} title="WhatsApp Support" description="Where the customer WhatsApp Support buttons lead. Not a secret; customers see this number." badge={<SourceBadge record={form.record} />}>
    <SettingsSwitch checked={draft.enabled} onChange={enabled => form.update({ enabled })} label="Enable WhatsApp Support" description="Shows WhatsApp as a working option on Home, tracking results and Customer Support." />
    <div className="dhl-admin-form-grid">
      <label className="dhl-admin-form-field"><span>Country code</span><div className="dhl-settings-prefixed"><b>+</b><input inputMode="numeric" value={draft.countryCode} onChange={event => form.update({ countryCode: event.target.value.replace(/[^\d]/g, '').slice(0, 4) })} placeholder="1" aria-label="Country code" /></div></label>
      <label className="dhl-admin-form-field"><span>WhatsApp number</span><input type="tel" inputMode="tel" value={draft.number} onChange={event => form.update({ number: event.target.value })} placeholder="555 000 0000" /></label>
      <label className="dhl-admin-form-field"><span>Display label</span><input value={draft.displayLabel} onChange={event => form.update({ displayLabel: event.target.value })} placeholder="WhatsApp Support" /></label>
      <div className="dhl-admin-form-field"><span>Customers are sent to</span><output className="dhl-settings-output">{destination ? `+${destination}` : 'No number set'}</output></div>
      <label className="dhl-admin-form-field wide"><span>Default customer message</span><textarea rows={2} value={draft.defaultMessage} onChange={event => form.update({ defaultMessage: event.target.value })} /></label>
      <label className="dhl-admin-form-field wide"><span>Tracking message template <em>use {'{trackingId}'} for the tracking number</em></span><textarea rows={2} value={draft.trackingMessageTemplate} onChange={event => form.update({ trackingMessageTemplate: event.target.value })} /></label>
    </div>
    <div className="dhl-settings-preview-bubble"><small>Prefilled message preview</small><p>{whatsappMessage(draft, SAMPLE_TRACKING)}</p></div>
    <div className="dhl-settings-actions-row">
      <div><strong>Try it</strong><small>{issue ? issue : 'Opens WhatsApp in a new tab using the values above (saved or not).'}</small></div>
      <div className="dhl-settings-inline-actions">
        {testLink ? <a className="dhl-admin-button" href={testLink} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />Test WhatsApp Link</a> : <button type="button" className="dhl-admin-button" disabled><ExternalLink size={15} />Test WhatsApp Link</button>}
        {openLink ? <a className="dhl-admin-button" href={openLink} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={15} />Open WhatsApp</a> : <button type="button" className="dhl-admin-button" disabled><WhatsAppIcon size={15} />Open WhatsApp</button>}
      </div>
    </div>
    <SaveBar dirty={form.dirty} saving={form.saving} disabled={!form.record?.writable || Boolean(issue)} disabledReason={!form.record?.writable ? 'Settings storage is created during deployment (app_settings migration).' : issue || undefined} onSave={() => void form.submit('WhatsApp settings saved. Customer buttons now use this number.')} onReset={form.reset} feedback={form.feedback} />
  </SettingsCard>;
}
