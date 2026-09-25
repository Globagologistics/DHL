import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandLogo, PageHeading } from '../components/customer/CustomerShell';
import { supabase } from '../../lib/supabase';
import { environment } from '../../config/environment';

const REMEMBERED_EMAIL_KEY = 'dhl-concept-remembered-email';

export default function SignIn() {
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBERED_EMAIL_KEY) || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const adminDestination = next?.startsWith('/admin') ?? false;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { setError(result.error.message); setLoading(false); return; }
    if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim()); else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    const requestedPath = next?.startsWith('/') && !next.startsWith('//') ? next : null;
    const { data: profile } = await supabase.from('users').select('user_type').eq('id', result.data.user.id).maybeSingle();
    navigate(requestedPath || (profile?.user_type === 'admin' ? '/admin' : '/home'), { replace: true });
  };
  return <div className="dhl-narrow dhl-search-page"><PageHeading title={adminDestination ? 'Admin sign in' : 'Sign in'} backTo="/home"/><section className="dhl-card" style={{ padding: 'clamp(22px,5vw,38px)', maxWidth: 460, margin: 'auto' }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}><BrandLogo/></div><p className="dhl-muted" style={{ marginBottom: 22 }}>{adminDestination ? 'Sign in with an authorized admin account to open the operations console.' : 'Use the account linked to your shipment to access private support.'}</p><form className="dhl-auth-form" onSubmit={submit}><label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password"/></label><label className="dhl-auth-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)}/> Remember my email</label>{error && <p className="dhl-error-text" role="alert">{error}</p>}<button className="dhl-primary-button" disabled={loading} type="submit">{loading ? 'Signing in…' : 'Sign In'}</button></form>{adminDestination && environment.devAdminBypass && <div className="dhl-dev-admin-entry"><small>Development only</small><button type="button" className="dhl-secondary-button" onClick={() => navigate(next?.startsWith('/admin') ? next : '/admin')}>Enter Admin Dashboard (Development)</button></div>}<p className="dhl-muted" style={{ marginTop: 20, fontSize: 12 }}>Need an account? <Link className="dhl-text-button" to="/signup">Account access information</Link></p></section></div>;
}
