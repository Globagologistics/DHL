import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, Send, ShieldCheck } from 'lucide-react';
import { FeedbackLine, SaveBar, SettingsCard, SettingsSwitch, SourceBadge, StatePill, formatDateTime, useSettingsForm } from '../SettingsPrimitives';
import type { Feedback } from '../SettingsPrimitives';
import type { EmailConfigurationStatus, EmailProvider, SmtpEncryption } from '../types';
import { getEmailConfigurationStatus, getEmailSettings, saveEmailSettings, sendTestEmail, submitEmailCredential, validateEmailSettings } from '../../../services/settings/integrationSettingsService';

const sourceLabels: Record<EmailConfigurationStatus['source'], string> = {
  'server-environment': 'Server environment',
  'secure-store': 'Secure credential store',
  'development-mock': 'Development mock',
  unavailable: 'Endpoint unavailable',
};

export function EmailSection() {
  const form = useSettingsForm(getEmailSettings, saveEmailSettings);
  const [status, setStatus] = useState<EmailConfigurationStatus | null>(null);
  // The app password lives only in this field until it is submitted, then it is cleared.
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [credentialFeedback, setCredentialFeedback] = useState<Feedback | null>(null);
  const [testFeedback, setTestFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState<'credential' | 'test' | null>(null);
  useEffect(() => { void getEmailConfigurationStatus().then(setStatus); }, []);
  const draft = form.draft;
  if (!draft) return <SettingsCard id="email" icon={Mail} title="Email & SMTP" description="Loading email settings…"><div className="dhl-settings-skeleton" /></SettingsCard>;
  const gmail = draft.provider === 'gmail';
  const showCredentialField = !status?.credentialConfigured || replacing;

  const saveCredential = async () => {
    setBusy('credential'); setCredentialFeedback(null);
    try {
      const next = await submitEmailCredential({ settings: draft, appPassword });
      setStatus(next); setReplacing(false);
      setCredentialFeedback({ tone: 'ok', text: next.source === 'development-mock' ? 'Development mock: marked as configured. The password was discarded, nothing was stored.' : 'Credential stored securely. It will not be shown again.' });
    } catch (error) {
      setCredentialFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Credential could not be saved.' });
    } finally {
      setAppPassword(''); setShowPassword(false); setBusy(null);
    }
  };
  const test = async () => {
    setBusy('test'); setTestFeedback(null);
    try { setTestFeedback({ tone: 'ok', text: await sendTestEmail() }); }
    catch (error) { setTestFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Test email failed.' }); }
    finally { setBusy(null); }
  };
  const credentialIssue = appPassword ? validateEmailSettings(draft, appPassword) : null;

  return <SettingsCard id="email" icon={Mail} title="Email & SMTP" description="Sender identity and the SMTP account used for shipment emails. The app password is write-only." badge={<SourceBadge record={form.record} />}>
    <SettingsSwitch checked={draft.enabled} onChange={enabled => form.update({ enabled })} label="Email notifications enabled" description="Send shipment and support emails to customers and the admin." />
    <div className="dhl-admin-segmented" role="radiogroup" aria-label="Email provider">
      {(['gmail', 'custom'] as EmailProvider[]).map(provider => <button key={provider} type="button" role="radio" aria-checked={draft.provider === provider} className={draft.provider === provider ? 'active' : ''} onClick={() => form.update({ provider, ...(provider === 'gmail' ? { host: 'smtp.gmail.com', port: 465, encryption: 'ssl' as SmtpEncryption } : {}) })}>{provider === 'gmail' ? 'Gmail' : 'Custom SMTP'}</button>)}
    </div>
    <div className="dhl-admin-form-grid">
      <label className="dhl-admin-form-field"><span>Sender name</span><input value={draft.senderName} onChange={event => form.update({ senderName: event.target.value })} placeholder="DHL Express" /></label>
      <label className="dhl-admin-form-field"><span>Sender email</span><input type="email" inputMode="email" value={draft.senderEmail} onChange={event => form.update({ senderEmail: event.target.value })} placeholder="notifications@company.com" /></label>
      <label className="dhl-admin-form-field"><span>{gmail ? 'Gmail account (SMTP username)' : 'SMTP username'}</span><input value={draft.smtpUsername} onChange={event => form.update({ smtpUsername: event.target.value })} placeholder={gmail ? 'account@gmail.com' : 'smtp-user'} autoComplete="off" /></label>
      <label className="dhl-admin-form-field"><span>Admin notification email</span><input type="email" inputMode="email" value={draft.adminNotificationEmail} onChange={event => form.update({ adminNotificationEmail: event.target.value })} placeholder="operations@company.com" /></label>
      {!gmail && <>
        <label className="dhl-admin-form-field"><span>SMTP host</span><input value={draft.host} onChange={event => form.update({ host: event.target.value })} placeholder="smtp.example.com" autoComplete="off" /></label>
        <label className="dhl-admin-form-field"><span>Port</span><input type="number" inputMode="numeric" value={draft.port} onChange={event => form.update({ port: Number(event.target.value) })} placeholder="465" /></label>
        <label className="dhl-admin-form-field"><span>Encryption</span><select value={draft.encryption} onChange={event => form.update({ encryption: event.target.value as SmtpEncryption })}><option value="ssl">SSL (implicit, usually port 465)</option><option value="tls">TLS / STARTTLS (usually port 587)</option></select></label>
      </>}
    </div>
    {gmail && <p className="dhl-settings-hint">Gmail uses smtp.gmail.com; the secure port is chosen on the server.</p>}
    <SaveBar dirty={form.dirty} saving={form.saving} disabled={!form.record?.writable} disabledReason="Settings storage is created during deployment (app_settings migration)." onSave={() => void form.submit('Email settings saved.')} onReset={form.reset} feedback={form.feedback} />

    <div className="dhl-settings-credential">
      <div className="dhl-settings-credential-head">
        <div><h3><ShieldCheck size={16} /> {gmail ? 'Google App Password' : 'SMTP password'}</h3><small>{status ? `${sourceLabels[status.source]} · Last updated ${formatDateTime(status.credentialUpdatedAt)}` : 'Checking…'}</small></div>
        {status ? <StatePill state={status.state} /> : null}
      </div>
      {status && <p className="dhl-settings-hint">{status.detail}</p>}
      {gmail && <p className="dhl-settings-hint strong">Use a 16-letter App Password from Google Account → Security → 2-Step Verification → App passwords. Never enter the Gmail account password.</p>}
      {showCredentialField ? <div className="dhl-settings-credential-form">
        <label className="dhl-admin-form-field"><span>{gmail ? 'App password' : 'Password / app password'}</span><div className="dhl-settings-password"><input type={showPassword ? 'text' : 'password'} value={appPassword} onChange={event => { setAppPassword(event.target.value); setCredentialFeedback(null); }} autoComplete="new-password" placeholder={gmail ? 'xxxx xxxx xxxx xxxx' : '••••••••'} spellCheck={false} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        {credentialIssue && <p className="dhl-settings-feedback error">{credentialIssue}</p>}
        <div className="dhl-settings-inline-actions">
          {replacing && <button type="button" className="dhl-admin-button" onClick={() => { setReplacing(false); setAppPassword(''); }}>Cancel</button>}
          <button type="button" className="dhl-admin-button primary" disabled={!appPassword || Boolean(credentialIssue) || busy !== null} onClick={() => void saveCredential()}>{busy === 'credential' ? 'Saving…' : 'Save credential securely'}</button>
        </div>
      </div> : <div className="dhl-settings-configured"><span>Configured</span><small>The credential is stored server-side and cannot be displayed.</small><button type="button" className="dhl-admin-button" onClick={() => setReplacing(true)}>Replace credential</button></div>}
      <FeedbackLine feedback={credentialFeedback} />
    </div>

    <div className="dhl-settings-actions-row">
      <div><strong>Test email</strong><small>{status?.testEmailAvailable ? 'Sends a message to the signed-in administrator.' : 'Available after email configuration.'}</small></div>
      <button type="button" className="dhl-admin-button" disabled={!status?.testEmailAvailable || busy !== null} onClick={() => void test()}><Send size={15} />{busy === 'test' ? 'Sending…' : 'Send Test Email'}</button>
    </div>
    <FeedbackLine feedback={testFeedback} />
  </SettingsCard>;
}
