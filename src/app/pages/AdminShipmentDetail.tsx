import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Copy, ExternalLink, FileText, History, Image as ImageIcon, MapPinned, MessageCircle, Package, Pencil, Radio, Send, Trash2, UserRound, X } from 'lucide-react';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { CopyButton } from '../../features/clipboard/CopyButton';
import { ImageCarousel } from '../../features/media/ImageCarousel';
import { RoutePicker } from '../../features/map/RoutePicker';
import { ShipmentRouteCard } from '../../features/map/ShipmentRouteCard';
import { LocationSearch, RouteLocationField } from '../../features/map/LocationFields';
import { ACTIVE_STATES, FINAL_STATES, PAUSE_REASONS, actionRules, allowedActions, canSoftDelete, customerUpdateMessage, deriveLifecycleState, displayProgress, lifecycleLabels } from '../../features/shipments/lifecycle';
import type { LifecycleAction } from '../../features/shipments/lifecycle';
import { LifecycleBadge, whatsappToPhone } from '../../features/shipments/ShipmentBits';
import { ShipmentCredentialCard, ShipmentReceipt } from '../../features/shipments/ShipmentCredential';
import { confirmShipmentExists } from '../../services/shipmentWorkflowService';
import { buildTimeline } from '../../features/shipments/timeline';
import { paymentLabels } from '../../features/shipments/types';
import type { RoutePoint, ShipmentRoute } from '../../features/shipments/types';
import { WhatsAppIcon } from '../../features/whatsapp/WhatsAppSupport';
import { addShipmentUpdate, draftFromShipment, publishShipment, setRouteProgress, setShipmentRoute, softDeleteShipment, transitionShipment } from '../../services/shipmentWorkflowService';
import { toRoutePoint } from '../../services/locationService';
import { formatTrackingNumber } from '../../services/trackingService';
import type { Shipment, ShipmentWithCheckpoints } from '../../types/database';

type Tab = 'overview' | 'tracking' | 'route' | 'customer' | 'photos' | 'history';
const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: 'overview', label: 'Overview', icon: Package }, { id: 'tracking', label: 'Tracking', icon: Radio }, { id: 'route', label: 'Route', icon: MapPinned },
  { id: 'customer', label: 'Customer', icon: UserRound }, { id: 'photos', label: 'Photos & Documents', icon: ImageIcon }, { id: 'history', label: 'History', icon: History },
];
type HistoryRow = { id: string; previous_status: string | null; new_status: string; customer_visible_reason: string | null; created_at: string };
type Done = { action: LifecycleAction; reason: string; trackingNumber?: string; published?: Shipment };

const when = (value?: string | null) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set';
const money = (currency?: string, value?: number | null) => value != null ? `${currency || 'USD'} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not provided';
const shortPlace = (value?: string | null) => (value || '').split(',').slice(-3, -1).join(',').trim() || value || '—';

const guidance: Record<string, string> = {
  draft: 'Complete the details, then publish.',
  pending_review: 'Waiting for review.',
  scheduled: 'Check the details, then publish to issue the tracking number. Nothing moves yet.',
  awaiting_takeoff: 'Published and trackable. Start the shipment when it actually departs.',
  in_transit: 'Moving toward the delivery estimate. Post updates, pause or stop if something happens.',
  paused: 'Temporarily paused. Customers see your reason. Resume when ready.',
  stopped: 'Stopped. Customers see your reason. Restart or terminate.',
  delivered: 'Delivered. This shipment is complete.',
  cancelled: 'Cancelled before it started.',
  terminated: 'Terminated. This is final.',
};

/**
 * Soft deletion, confirmed deliberately. The shipment leaves active lists and
 * public tracking; its chat, status history and images are kept. The permanent
 * demo shipment is refused here and again by soft_delete_shipment.
 */
function DeleteShipmentDialog({ shipment, busy, onClose, onConfirm }: { shipment: ShipmentWithCheckpoints; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState('');
  const tracking = shipment.tracking_number || '';
  const isDemo = Boolean(shipment.is_demo) || tracking === '010101010101';
  const expected = tracking || 'DELETE';
  const blocked = isDemo || busy || typed.trim() !== expected;
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [busy, onClose]);
  return <div className="dhl-admin-modal-layer" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <form className="dhl-admin-confirm dhl-lifecycle-dialog danger" role="dialog" aria-modal="true" aria-labelledby="delete-shipment-title" onSubmit={event => { event.preventDefault(); if (!blocked) onConfirm(); }}>
      <button type="button" className="dhl-lifecycle-close" onClick={onClose} aria-label="Close" disabled={busy}><X size={18} /></button>
      <h2 id="delete-shipment-title">Delete Shipment?</h2>
      <dl className="dhl-delete-facts">
        <div><dt>Tracking ID</dt><dd className="mono">{tracking ? formatTrackingNumber(tracking) : 'Not issued yet'}</dd></div>
        <div><dt>Shipment</dt><dd>{shipment.package_name || 'Shipment'}</dd></div>
        <div><dt>Sender</dt><dd>{shipment.sender_name || '—'}</dd></div>
        <div><dt>Receiver</dt><dd>{shipment.receiver_name || '—'}</dd></div>
      </dl>
      {isDemo
        ? <p className="dhl-admin-banner error" role="alert">Permanent demo shipment cannot be deleted.</p>
        : <>
          <p>This shipment will be removed from active shipment management and public tracking. Its chat history, status history and images are kept for audit.</p>
          <label className="dhl-admin-form-field"><span>Type {expected} to confirm</span><input value={typed} onChange={event => setTyped(event.target.value)} autoComplete="off" autoFocus aria-label={`Type ${expected} to confirm deletion`} /></label>
        </>}
      <div>
        <button type="button" className="dhl-admin-button" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="submit" className="dhl-admin-button danger-solid" disabled={blocked}>{busy ? 'Deleting…' : 'Delete Shipment'}</button>
      </div>
    </form>
  </div>;
}

function ActionDialog({ action, shipment, onClose, onDone }: { action: LifecycleAction; shipment: ShipmentWithCheckpoints; onClose: () => void; onDone: (done: Done) => void }) {
  const rule = actionRules[action];
  const [reason, setReason] = useState(action === 'pause' ? PAUSE_REASONS[0] : '');
  const [custom, setCustom] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [busy, onClose]);
  const finalReason = action === 'pause' ? (reason === 'Other' ? custom : reason) : reason;
  const blocked = (rule.reason === 'required' && !finalReason.trim()) || (rule.confirmText ? typed !== rule.confirmText : false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (blocked) return;
    setBusy(true); setError('');
    try {
      if (action === 'publish') {
        const issued = await publishShipment(shipment.id);
        // The card is built from the stored record, never from this response.
        const stored = await confirmShipmentExists(shipment.id);
        if (!stored.tracking_number) throw new Error('The shipment was published but no tracking number was recorded. Please reload and check.');
        onDone({ action, reason: '', trackingNumber: stored.tracking_number || issued, published: stored });
      }
      else { await transitionShipment(shipment.id, action, finalReason); onDone({ action, reason: finalReason.trim() }); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'That did not work. Please try again.'); setBusy(false); }
  };
  return <div className="dhl-admin-modal-layer" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <form className={`dhl-admin-confirm dhl-lifecycle-dialog ${rule.tone}`} role="dialog" aria-modal="true" aria-labelledby="lifecycle-title" onSubmit={submit}>
      <button type="button" className="dhl-lifecycle-close" onClick={onClose} aria-label="Close" disabled={busy}><X size={18} /></button>
      <h2 id="lifecycle-title">{rule.label}?</h2>
      <p>{rule.description}</p>
      {action === 'pause' && <div className="dhl-lifecycle-reasons" role="radiogroup" aria-label="Reason for pause">{PAUSE_REASONS.map(option => <button key={option} type="button" role="radio" aria-checked={reason === option} className={reason === option ? 'active' : ''} onClick={() => setReason(option)}>{option}</button>)}</div>}
      {action === 'pause' && reason === 'Other' && <label className="dhl-admin-form-field"><span>Describe the reason</span><input value={custom} onChange={event => setCustom(event.target.value)} maxLength={200} autoFocus /></label>}
      {action !== 'pause' && rule.reason === 'required' && <label className="dhl-admin-form-field"><span>Reason (customers will see this)</span><textarea rows={2} value={reason} onChange={event => setReason(event.target.value)} maxLength={300} autoFocus placeholder={action === 'stop' ? 'e.g. Held for customs documentation' : action === 'cancel' ? 'e.g. Sender cancelled the order' : 'e.g. Package lost in transit'} /></label>}
      {rule.confirmText && <label className="dhl-admin-form-field"><span>Type {rule.confirmText} to confirm</span><input value={typed} onChange={event => setTyped(event.target.value)} autoComplete="off" /></label>}
      {action === 'start' && <p className="dhl-lifecycle-note"><Clock3 size={15} /> The start time will be recorded as now ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).</p>}
      {error && <p className="dhl-admin-banner error" role="alert">{error}</p>}
      <div><button type="button" className="dhl-admin-button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className={`dhl-admin-button ${rule.tone === 'danger' ? 'danger-solid' : 'primary'}`} disabled={busy || blocked}>{busy ? 'Working…' : rule.label}</button></div>
    </form>
  </div>;
}

export default function AdminShipmentDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { shipment, loading } = useShipmentWithCheckpoints(id);
  const requestedTab = params.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(requestedTab && tabs.some(item => item.id === requestedTab) ? requestedTab : 'overview');
  const [dialog, setDialog] = useState<LifecycleAction | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(params.get('receipt') === '1');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState(params.get('created') ? 'Shipment created and scheduled. Publish it when you are ready to issue the tracking number.' : params.get('saved') ? 'Changes saved.' : '');
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [update, setUpdate] = useState<{ title: string; location: string; point: RoutePoint | null }>({ title: '', location: '', point: null });
  const [manualPins, setManualPins] = useState(false);
  const [progressDraft, setProgressDraft] = useState<number | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [updateState, setUpdateState] = useState<{ busy: boolean; message: string; error: boolean }>({ busy: false, message: '', error: false });
  const [route, setRoute] = useState<ShipmentRoute | null>(null);
  const [routeMessage, setRouteMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (requestedTab && tabs.some(item => item.id === requestedTab)) setTab(requestedTab); }, [requestedTab]);
  useEffect(() => { if (params.get('created') || params.get('saved')) { const next = new URLSearchParams(params); next.delete('created'); next.delete('saved'); setParams(next, { replace: true }); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!id) return;
    let active = true;
    void (async () => { const { data } = await supabase.from('shipment_status_history').select('id,previous_status,new_status,customer_visible_reason,created_at').eq('shipment_id', id).order('created_at', { ascending: false }).limit(100); if (active) setHistory((data || []) as HistoryRow[]); })();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="dhl-admin-empty"><Package size={25} /><strong>Loading shipment…</strong></div>;
  if (!shipment) return <div className="dhl-admin-empty"><Package size={25} /><strong>Shipment not found</strong><Link className="dhl-admin-button" to="/admin/shipments">Back to Shipments</Link></div>;

  const state = deriveLifecycleState(shipment);
  const actions = allowedActions(state);
  const published = Boolean(shipment.is_published && shipment.tracking_number);
  const trackingNumber = shipment.tracking_number || '';
  const timeline = buildTimeline(shipment);
  const routeDraft: ShipmentRoute = route || draftFromShipment(shipment).route;
  const whatsappUpdate = done ? whatsappToPhone(shipment.receiver_phone, customerUpdateMessage({ ...shipment, tracking_number: done.trackingNumber || shipment.tracking_number }, done.action, done.reason)) : null;
  const greeting = `Hello ${shipment.receiver_name}, this is DHL Shipment Support${published ? ` about shipment ${trackingNumber}` : ''}.`;
  const whatsappReceiver = whatsappToPhone(shipment.receiver_phone, greeting);
  const primary = actions.filter(action => ['publish', 'start', 'resume', 'restart'].includes(action));
  const secondary = actions.filter(action => !primary.includes(action));

  const postUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setUpdateState({ busy: true, message: '', error: false });
    try { await addShipmentUpdate(shipment.id, update.title, update.location, update.point); setUpdate({ title: '', location: '', point: null }); setUpdateState({ busy: false, message: 'Update posted to the customer timeline.', error: false }); }
    catch (cause) { setUpdateState({ busy: false, message: cause instanceof Error ? cause.message : 'Update could not be posted.', error: true }); }
  };
  const saveRoute = async () => {
    setRouteMessage('');
    try { await setShipmentRoute(shipment.id, routeDraft); setRouteMessage('Route saved. The customer map now uses it.'); setRoute(null); }
    catch (cause) { setRouteMessage(cause instanceof Error ? cause.message : 'Route could not be saved.'); }
  };
  const saveProgress = async (value: number | null) => {
    setProgressMessage('');
    try { await setRouteProgress(shipment.id, value); setProgressDraft(null); setProgressMessage(value == null ? 'Progress follows the journey timeline again.' : `Route progress set to ${Math.round(value)}%.`); }
    catch (cause) { setProgressMessage(cause instanceof Error ? cause.message : 'Route progress could not be saved.'); }
  };
  const remove = async () => {
    setDeleting(true);
    try { await softDeleteShipment(shipment.id); navigate('/admin/shipments', { replace: true }); }
    catch (cause) { setDeleteOpen(false); setNotice(cause instanceof Error ? cause.message : 'The shipment could not be deleted.'); setDeleting(false); }
  };

  return <div className="dhl-admin-shipment-detail dhl-control">
    <Link className="dhl-admin-detail-back" to="/admin/shipments"><ArrowLeft size={16} /> Back to Shipments</Link>

    <section className="dhl-admin-card dhl-control-header">
      <div className="dhl-control-title">
        <span className="dhl-admin-eyebrow">SHIPMENT CONTROL</span>
        <h1>{shipment.package_name || 'Shipment'}</h1>
        <div className="dhl-control-meta"><LifecycleBadge state={state} /><span><UserRound size={14} /> {shipment.receiver_name}</span><span>{shortPlace(shipment.pickup_location)} → {shortPlace(shipment.delivery_address)}</span></div>
      </div>
      <div className={`dhl-control-tracking${published ? ' issued' : ''}`}>
        <small>Tracking Number</small>
        {published ? <><strong>{formatTrackingNumber(trackingNumber)}</strong><div><CopyButton value={trackingNumber} className="dhl-admin-button" icon={<Copy size={15} aria-hidden="true" />} label="Copy Tracking Number" /><a className="dhl-admin-button" href={`/track/${trackingNumber}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />Open Public Tracking</a></div></>
          : <span>Assigned automatically when you publish.</span>}
      </div>
    </section>

    {notice && <p className="dhl-admin-banner" role="status">{notice}</p>}
    {done?.action === 'publish' && done.published && <ShipmentCredentialCard shipment={done.published} onViewReceipt={() => setReceiptOpen(true)} onDismiss={() => setDone(null)} />}
    {done && done.action !== 'publish' && <div className="dhl-admin-card dhl-control-done" role="status">
      <CheckCircle2 size={22} />
      <div><strong>{`${actionRules[done.action].label.replace(' Shipment', '')} complete · ${lifecycleLabels[state]}`}</strong><span>Customers see the change on the tracking page. Email goes out automatically when email notifications are configured. WhatsApp is not sent automatically.</span></div>
      {whatsappUpdate && <a className="dhl-admin-button whatsapp" href={whatsappUpdate} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={15} />Send Update on WhatsApp</a>}
      <button type="button" className="dhl-control-dismiss" onClick={() => setDone(null)} aria-label="Dismiss"><X size={16} /></button>
    </div>}

    <section className="dhl-admin-card dhl-control-actions" aria-label="Shipment actions">
      <p>{guidance[state]}</p>
      <div>
        {primary.map(action => <button key={action} type="button" className="dhl-admin-button primary" onClick={() => setDialog(action)}>{actionRules[action].label}</button>)}
        {['draft', 'scheduled', 'awaiting_takeoff'].includes(state) && <Link className="dhl-admin-button" to={`/admin/shipments/${shipment.id}/edit`}><Pencil size={15} />Edit Shipment</Link>}
        <button type="button" className="dhl-admin-button" onClick={() => setReceiptOpen(true)}><FileText size={15} />View Receipt</button>
        {secondary.map(action => <button key={action} type="button" className={`dhl-admin-button${actionRules[action].tone === 'danger' ? ' danger' : ''}`} onClick={() => setDialog(action)}>{actionRules[action].label}</button>)}
        {published && <Link className="dhl-admin-button" to={`/admin/chat?tracking=${encodeURIComponent(shipment.id)}`}><MessageCircle size={15} />Contact Customer</Link>}
        {canSoftDelete(state) && <button type="button" className="dhl-admin-button danger" onClick={() => setDeleteOpen(true)} disabled={deleting}><Trash2 size={15} />{deleting ? 'Deleting…' : 'Delete Shipment'}</button>}
      </div>
    </section>

    <div className="dhl-admin-detail-tabs" role="tablist" aria-label="Shipment information">{tabs.map(({ id: value, label, icon: Icon }) => <button type="button" role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)} key={value}><Icon size={15} />{label}</button>)}</div>

    {tab === 'overview' && <div className="dhl-admin-detail-grid">
      <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Consignment</h2><Package size={18} /></div>
        <dl className="dhl-admin-detail-facts">
          <div><dt>Package</dt><dd>{shipment.package_name || 'Not provided'}</dd></div>
          <div><dt>Package value</dt><dd>{money(shipment.currency, shipment.package_value)}</dd></div>
          <div><dt>Payment</dt><dd>{paymentLabels[shipment.payment_status || 'unpaid']}{shipment.payment_status === 'pending' && shipment.outstanding_amount ? ` · ${money(shipment.currency, shipment.outstanding_amount)} outstanding` : ''}</dd></div>
          <div><dt>Transport</dt><dd>{shipment.transportation}</dd></div>
          <div><dt>Carrier</dt><dd>{[shipment.carrier_role, shipment.driver_name].filter(Boolean).join(' · ') || 'Not provided'}</dd></div>
          <div><dt>Estimated delivery</dt><dd>{when(shipment.estimated_delivery_at)}</dd></div>
          <div><dt>Started</dt><dd>{shipment.started_at ? when(shipment.started_at) : 'Not started'}</dd></div>
          <div><dt>Created</dt><dd>{when(shipment.created_at)}</dd></div>
        </dl>
        {(ACTIVE_STATES.includes(state) || FINAL_STATES.includes(state)) && shipment.customer_status_reason && <p className="dhl-control-reason"><strong>Customer-visible reason:</strong> {shipment.customer_status_reason}</p>}
      </section>
      <aside className="dhl-admin-card dhl-control-photos"><div className="dhl-admin-card-head"><h2>Package photos</h2><ImageIcon size={18} /></div><ImageCarousel images={(shipment.images || []).filter(Boolean)} /></aside>
    </div>}

    {tab === 'tracking' && <div className="dhl-admin-detail-grid">
      <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Customer timeline</h2><Radio size={18} /></div>
        {timeline.history.length ? <ol className="dhl-admin-detail-timeline">{timeline.history.map(entry => <li className={entry.tone} key={entry.id}><span className="dhl-admin-timeline-node" /><div><strong>{entry.title}</strong><small>{[entry.location, entry.detail].filter(Boolean).join(' · ') || ' '}</small></div><time>{when(entry.at)}</time></li>)}</ol> : <div className="dhl-admin-empty"><Radio size={22} /><strong>No updates yet</strong><span>Updates appear once the shipment is published.</span></div>}
      </section>
      <aside className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Post a tracking update</h2><Send size={18} /></div>
        {published && !FINAL_STATES.includes(state) ? <form className="dhl-control-update" onSubmit={postUpdate}>
          <label className="dhl-admin-form-field"><span>Update customers will see</span><input value={update.title} onChange={event => setUpdate(value => ({ ...value, title: event.target.value }))} placeholder="e.g. Arrived at transit hub" maxLength={140} /></label>
          <div className="dhl-admin-form-field"><span>Location <em>(Optional · pick one to add it to the route map)</em></span>
            {update.point ? <div className="dhl-route-location-value"><span><strong>{update.point.detail || update.location}</strong><small>Adds a checkpoint on the route map</small></span><button type="button" onClick={() => setUpdate(value => ({ ...value, location: '', point: null }))}>Change</button></div>
              : <LocationSearch label="Checkpoint location" placeholder="e.g. Louisville, Kentucky" onSelect={location => setUpdate(value => ({ ...value, location: location.shortLabel, point: toRoutePoint(location) }))} />}
          </div>
          {updateState.message && <p className={`dhl-settings-feedback ${updateState.error ? 'error' : 'ok'}`}>{updateState.message}</p>}
          <button type="submit" className="dhl-admin-button primary" disabled={updateState.busy || !update.title.trim()}>{updateState.busy ? 'Posting…' : 'Post Update'}</button>
        </form> : <p className="dhl-settings-notice">{published ? 'This shipment is complete.' : 'Publish the shipment first; updates are shown on its public tracking page.'}</p>}
      </aside>
    </div>}

    {tab === 'route' && <div className="dhl-admin-detail-grid route">
      <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Shipment route</h2><MapPinned size={18} /></div><ShipmentRouteCard shipment={shipment} height={340} /></section>
      <aside className="dhl-control-route-tools">
        <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Route locations</h2></div>
          <div className="dhl-control-route-fields">
            <RouteLocationField label="Pickup location" address={shipment.pickup_location || ''} value={routeDraft.origin} onChange={origin => { setRoute({ ...routeDraft, origin }); setRouteMessage(''); }} />
            <RouteLocationField label="Drop-off location" address={shipment.delivery_address} value={routeDraft.destination} onChange={destination => { setRoute({ ...routeDraft, destination }); setRouteMessage(''); }} />
          </div>
          {routeMessage && <p className="dhl-settings-feedback ok">{routeMessage}</p>}
          <button type="button" className="dhl-admin-button primary" disabled={!route} onClick={() => void saveRoute()}>Save Route</button>
          <button type="button" className="dhl-admin-text-action" onClick={() => setManualPins(open => !open)}>{manualPins ? 'Hide manual placement' : 'Advanced: place pins manually'}</button>
          {manualPins && <RoutePicker route={routeDraft} onChange={next => { setRoute(next); setRouteMessage(''); }} />}
        </section>
        <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Route progress</h2></div>
          <p className="dhl-settings-hint">Moves the red marker along the route for customers. Leave on automatic to follow the start time and delivery estimate.</p>
          <div className="dhl-control-progress"><input type="range" min={0} max={100} step={1} value={progressDraft ?? displayProgress(shipment)} onChange={event => setProgressDraft(Number(event.target.value))} aria-label="Route progress" disabled={!ACTIVE_STATES.includes(state) && state !== 'awaiting_takeoff'} /><output>{Math.round(progressDraft ?? displayProgress(shipment))}%</output></div>
          <small className="dhl-control-progress-mode">{shipment.route_progress != null ? `Set manually to ${Math.round(shipment.route_progress)}%` : 'Automatic (journey timeline)'}</small>
          {progressMessage && <p className="dhl-settings-feedback ok">{progressMessage}</p>}
          <div className="dhl-settings-inline-actions">{shipment.route_progress != null && <button type="button" className="dhl-admin-button" onClick={() => void saveProgress(null)}>Use Automatic</button>}<button type="button" className="dhl-admin-button primary" disabled={progressDraft == null} onClick={() => void saveProgress(progressDraft)}>Save Progress</button></div>
        </section>
      </aside>
    </div>}

    {tab === 'customer' && <div className="dhl-admin-detail-grid">
      <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Sender</h2><UserRound size={18} /></div><dl className="dhl-admin-detail-facts"><div><dt>Name</dt><dd>{shipment.sender_name}</dd></div><div><dt>Phone</dt><dd>{shipment.sender_phone || 'Not provided'}</dd></div><div><dt>Pickup address</dt><dd>{shipment.pickup_location || 'Not provided'}</dd></div></dl></section>
      <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Receiver</h2><UserRound size={18} /></div><dl className="dhl-admin-detail-facts"><div><dt>Name</dt><dd>{shipment.receiver_name}</dd></div><div><dt>Phone</dt><dd>{shipment.receiver_phone}</dd></div><div><dt>Email</dt><dd>{shipment.receiver_email || 'Not provided'}</dd></div><div><dt>Drop-off address</dt><dd>{shipment.delivery_address}</dd></div></dl>
        <div className="dhl-control-contact"><Link className="dhl-admin-button" to={`/admin/chat?tracking=${encodeURIComponent(shipment.id)}`}><MessageCircle size={15} />Open Support Chat</Link>{whatsappReceiver && <a className="dhl-admin-button whatsapp" href={whatsappReceiver} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={15} />WhatsApp Receiver</a>}</div>
      </section>
    </div>}

    {tab === 'photos' && <div className="dhl-admin-detail-grid">
      <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Package photos</h2><ImageIcon size={18} /></div><ImageCarousel images={(shipment.images || []).filter(Boolean)} aspect="16 / 10" /></section>
      <aside className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Documents</h2><FileText size={18} /></div><div className="dhl-admin-document-links">{published ? <a href={`/track/${trackingNumber}?view=waybill`} target="_blank" rel="noopener noreferrer"><FileText size={17} /> Waybill preview</a> : <span>The waybill preview is available after publishing.</span>}<p>The waybill is generated from the shipment record; no carrier-issued PDF is stored.</p></div></aside>
    </div>}

    {tab === 'history' && <div className="dhl-admin-detail-grid">
      <section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Lifecycle history</h2><History size={18} /></div>
        {(shipment.lifecycle_events || []).length ? <ol className="dhl-admin-detail-timeline">{[...(shipment.lifecycle_events || [])].reverse().map(event => <li key={event.id}><span className="dhl-admin-timeline-node" /><div><strong>{event.title}</strong><small>{[event.location, event.detail].filter(Boolean).join(' · ') || event.kind}</small></div><time>{when(event.at)}</time></li>)}</ol> : <div className="dhl-admin-empty"><History size={22} /><strong>No lifecycle history yet</strong></div>}
      </section>
      <aside className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Status audit</h2><Clock3 size={18} /></div>
        {history.length ? <ol className="dhl-admin-detail-timeline">{history.map(item => <li key={item.id}><span className="dhl-admin-timeline-node" /><div><strong>{item.new_status.replaceAll('_', ' ')}</strong><small>{item.customer_visible_reason || 'Status changed'}</small></div><time>{when(item.created_at)}</time></li>)}</ol> : <p className="dhl-settings-notice">Database status audit entries appear here for shipments stored in Supabase.</p>}
      </aside>
    </div>}

    {dialog && <ActionDialog action={dialog} shipment={shipment} onClose={() => setDialog(null)} onDone={result => { setDialog(null); setDone(result); setNotice(''); }} />}
    {receiptOpen && <ShipmentReceipt shipment={(done?.published || shipment) as Shipment} onClose={() => setReceiptOpen(false)} />}
    {deleteOpen && <DeleteShipmentDialog shipment={shipment} busy={deleting} onClose={() => setDeleteOpen(false)} onConfirm={() => void remove()} />}
  </div>;
}
