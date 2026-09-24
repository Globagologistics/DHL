import { BellRing } from 'lucide-react';
import { SaveBar, SettingsCard, SettingsSwitch, SourceBadge, useSettingsForm } from '../SettingsPrimitives';
import { notificationCategories } from '../types';
import { getNotificationPreferences, notificationCategoryLabels, saveNotificationPreferences } from '../../../services/settings/notificationSettingsService';

export function NotificationSection() {
  const form = useSettingsForm(getNotificationPreferences, saveNotificationPreferences);
  const draft = form.draft;
  if (!draft) return <SettingsCard id="notifications" icon={BellRing} title="Notifications" description="Loading notification preferences…"><div className="dhl-settings-skeleton" /></SettingsCard>;
  return <SettingsCard id="notifications" icon={BellRing} title="Notifications" description="Choose which events send email. The email worker reads these preferences once connected during deployment." badge={<SourceBadge record={form.record} />}>
    <SettingsSwitch checked={draft.emailEnabled} onChange={emailEnabled => form.update({ emailEnabled })} label="Email enabled" description="Master switch for every notification email below." />
    <div className="dhl-settings-toggle-list">
      {notificationCategories.map(category => <SettingsSwitch key={category} checked={draft.categories[category]} disabled={!draft.emailEnabled} onChange={value => form.update({ categories: { ...draft.categories, [category]: value } })} label={notificationCategoryLabels[category].label} description={notificationCategoryLabels[category].description} />)}
    </div>
    <SaveBar dirty={form.dirty} saving={form.saving} disabled={!form.record?.writable} disabledReason="Settings storage is created during deployment (app_settings migration)." onSave={() => void form.submit('Notification preferences saved.')} onReset={form.reset} feedback={form.feedback} />
  </SettingsCard>;
}
