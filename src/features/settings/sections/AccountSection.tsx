import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, LogOut, MailCheck, UserRound } from 'lucide-react';
import { FeedbackLine, SettingsCard, formatDateTime } from '../SettingsPrimitives';
import type { Feedback } from '../SettingsPrimitives';
import type { AdminAccountSettings } from '../types';
import { PASSWORD_MIN_LENGTH, changeAdminEmail, changeAdminPassword, getAdminAccount, passwordStrength, sendAdminPasswordReset, signOutOtherSessions } from '../../../services/settings/adminAccountService';

function PasswordInput({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="dhl-admin-form-field"><span>{label}</span><div className="dhl-settings-password"><input type={visible ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} autoComplete={autoComplete} /><button type="button" onClick={() => setVisible(current => !current)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>;
}

export function AccountSection() {
  const [account, setAccount] = useState<AdminAccountSettings | null | undefined>(undefined);
  const [newEmail, setNewEmail] = useState('');
  const [emailFeedback, setEmailFeedback] = useState<Feedback | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);
  const [sessionFeedback, setSessionFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState<'email' | 'password' | 'sessions' | 'reset' | null>(null);
  const load = () => void getAdminAccount().then(setAccount);
  useEffect(load, []);
  const strength = passwordStrength(next);
  const signedOut = account === null;

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault(); setBusy('email'); setEmailFeedback(null);
    try { setEmailFeedback({ tone: 'ok', text: await changeAdminEmail(newEmail) }); setNewEmail(''); load(); }
    catch (error) { setEmailFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Email could not be changed.' }); }
    finally { setBusy(null); }
  };
  const submitPassword = async (event: FormEvent) => {
    event.preventDefault(); setBusy('password'); setPasswordFeedback(null);
    try { await changeAdminPassword(current, next, confirmation); setPasswordFeedback({ tone: 'ok', text: 'Password changed. Use it the next time you sign in.' }); }
    catch (error) { setPasswordFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Password could not be changed.' }); }
    finally { setCurrent(''); setNext(''); setConfirmation(''); setBusy(null); }
  };
  const run = async (kind: 'sessions' | 'reset') => {
    setBusy(kind); setSessionFeedback(null);
    try {
      if (kind === 'sessions') { await signOutOtherSessions(); setSessionFeedback({ tone: 'ok', text: 'All other sessions were signed out. This session stays active.' }); }
      else setSessionFeedback({ tone: 'ok', text: await sendAdminPasswordReset(account?.email || '') });
    } catch (error) { setSessionFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Action failed.' }); }
    finally { setBusy(null); }
  };

  return <SettingsCard id="account" icon={UserRound} title="Admin Account" description="The single administrator who signs in to this dashboard. Passwords are never displayed.">
    {signedOut ? <p className="dhl-settings-notice">Sign in with the administrator account to change the email or password. The development bypass cannot change credentials.</p> : <>
      <dl className="dhl-settings-facts">
        <div><dt>Administrator email</dt><dd>{account?.email || '…'}</dd></div>
        <div><dt>Status</dt><dd>{account ? (account.emailConfirmed ? 'Email confirmed' : 'Email not confirmed') : '…'}</dd></div>
        <div><dt>Last sign-in</dt><dd>{account ? formatDateTime(account.lastSignInAt) : '…'}</dd></div>
        {account?.pendingEmail && <div><dt>Pending change</dt><dd>{account.pendingEmail} (awaiting confirmation)</dd></div>}
      </dl>
      <div className="dhl-settings-split">
        <form className="dhl-settings-subform" onSubmit={submitEmail}>
          <h3><MailCheck size={16} /> Change email</h3>
          <label className="dhl-admin-form-field"><span>New administrator email</span><input type="email" inputMode="email" value={newEmail} onChange={event => { setNewEmail(event.target.value); setEmailFeedback(null); }} autoComplete="email" placeholder="admin@company.com" /></label>
          <p className="dhl-settings-hint">A confirmation link is sent before the change takes effect.</p>
          <FeedbackLine feedback={emailFeedback} />
          <button type="submit" className="dhl-admin-button" disabled={!newEmail.trim() || busy !== null}>{busy === 'email' ? 'Sending…' : 'Change email'}</button>
        </form>
        <form className="dhl-settings-subform" onSubmit={submitPassword}>
          <h3><KeyRound size={16} /> Change password</h3>
          <PasswordInput label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
          <PasswordInput label="New password" value={next} onChange={value => { setNext(value); setPasswordFeedback(null); }} autoComplete="new-password" />
          {next && <div className={`dhl-settings-strength s${strength.score}`} aria-live="polite"><span><i /><i /><i /><i /></span><small>{strength.label}</small></div>}
          <PasswordInput label="Confirm new password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
          <p className="dhl-settings-hint">At least {PASSWORD_MIN_LENGTH} characters. Letters, numbers and symbols are all allowed; longer is stronger.</p>
          <FeedbackLine feedback={passwordFeedback} />
          <button type="submit" className="dhl-admin-button primary" disabled={!current || !next || !confirmation || busy !== null}>{busy === 'password' ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
      <div className="dhl-settings-actions-row">
        <div><strong>Sessions & recovery</strong><small>Sign out every other device, or email yourself a secure reset link.</small></div>
        <div className="dhl-settings-inline-actions">
          <button type="button" className="dhl-admin-button" onClick={() => void run('sessions')} disabled={busy !== null}><LogOut size={15} />{busy === 'sessions' ? 'Signing out…' : 'Sign out other sessions'}</button>
          <button type="button" className="dhl-admin-button" onClick={() => void run('reset')} disabled={busy !== null || !account?.email}>{busy === 'reset' ? 'Sending…' : 'Send password reset email'}</button>
        </div>
      </div>
      <FeedbackLine feedback={sessionFeedback} />
    </>}
  </SettingsCard>;
}
