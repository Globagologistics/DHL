import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { BrandLogo, PageHeading } from '../components/customer/CustomerShell';
import { PASSWORD_MIN_LENGTH, completePasswordReset, passwordStrength } from '../../services/settings/adminAccountService';

/** Landing page for Supabase password-recovery links sent from Admin Settings. */
export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const strength = passwordStrength(password);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try { await completePasswordReset(password, confirmation); setDone(true); setPassword(''); setConfirmation(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Password could not be updated.'); }
    finally { setSaving(false); }
  };
  return <div className="dhl-narrow dhl-search-page"><PageHeading title="Set a new password" backTo="/signin"/>
    <section className="dhl-card" style={{ padding: 'clamp(22px,5vw,38px)', maxWidth: 460, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}><BrandLogo/></div>
      {done ? <div style={{ textAlign: 'center' }}><CheckCircle2 size={36} color="#2E9B50"/><h2 style={{ margin: '12px 0 8px', fontSize: 22 }}>Password updated</h2><p className="dhl-muted" style={{ marginBottom: 20 }}>Use your new password the next time you sign in.</p><Link className="dhl-primary-button" to="/signin?next=/admin">Go to sign in</Link></div>
        : <form className="dhl-auth-form" onSubmit={submit}>
          <p className="dhl-muted">Choose a new password with at least {PASSWORD_MIN_LENGTH} characters. Letters, numbers and symbols are all allowed.</p>
          <label>New password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" required/></label>
          {password && <small className="dhl-muted">Strength: <strong>{strength.label}</strong></small>}
          <label>Confirm new password<input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" required/></label>
          {error && <p className="dhl-error-text" role="alert">{error}</p>}
          <button className="dhl-primary-button" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
        </form>}
    </section>
  </div>;
}
