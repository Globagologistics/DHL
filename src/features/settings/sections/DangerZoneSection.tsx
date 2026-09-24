import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RotateCcw, TriangleAlert, UserX } from 'lucide-react';
import { FeedbackLine, SettingsCard } from '../SettingsPrimitives';
import type { Feedback } from '../SettingsPrimitives';
import { signOutAllSessions } from '../../../services/settings/adminAccountService';

const CONFIRMATION = 'SIGN OUT';

/**
 * Only the reversible action is enabled. Resetting configuration and deleting
 * the administrator need current-password re-verification, typed confirmation
 * AND server-side authorization, which arrive with Part Two.
 */
export function DangerZoneSection() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const signOutEverywhere = async () => {
    setBusy(true); setFeedback(null);
    try { await signOutAllSessions(); navigate('/signin?next=/admin', { replace: true }); }
    catch (error) { setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Sessions could not be signed out.' }); setBusy(false); }
  };
  return <SettingsCard id="danger" icon={TriangleAlert} tone="danger" title="Danger Zone" description="Account-wide actions. Destructive operations stay locked until server-side authorization is in place.">
    <div className="dhl-settings-danger-row">
      <div><strong>Sign out all sessions</strong><small>Signs out every device, including this one.</small></div>
      {!confirming ? <button type="button" className="dhl-admin-button danger" onClick={() => setConfirming(true)}><LogOut size={15} />Sign Out All Sessions</button> : <div className="dhl-settings-confirm">
        <label className="dhl-admin-form-field"><span>Type {CONFIRMATION} to confirm</span><input value={typed} onChange={event => setTyped(event.target.value)} autoComplete="off" /></label>
        <div className="dhl-settings-inline-actions"><button type="button" className="dhl-admin-button" onClick={() => { setConfirming(false); setTyped(''); }}>Cancel</button><button type="button" className="dhl-admin-button danger" disabled={typed !== CONFIRMATION || busy} onClick={() => void signOutEverywhere()}>{busy ? 'Signing out…' : 'Confirm sign out'}</button></div>
      </div>}
    </div>
    <FeedbackLine feedback={feedback} />
    <div className="dhl-settings-danger-row locked">
      <div><strong>Reset application configuration</strong><small>Restores WhatsApp, notification and application settings to defaults. Requires server authorization.</small></div>
      <button type="button" className="dhl-admin-button" disabled><RotateCcw size={15} />Locked</button>
    </div>
    <div className="dhl-settings-danger-row locked">
      <div><strong>Delete admin account</strong><small>Permanently removes the administrator. Requires current password, typed confirmation and server authorization.</small></div>
      <button type="button" className="dhl-admin-button" disabled><UserX size={15} />Locked</button>
    </div>
  </SettingsCard>;
}
