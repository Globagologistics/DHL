import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Check, ChevronRight, Clock3, Copy, FileText, Image as ImageIcon, Map, Package, PlaneTakeoff, Truck, X } from 'lucide-react';
import { PageHeading, ShipmentProgress, StatusBadge } from '../components/customer/CustomerShell';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { brandConfig } from '../../config/brand';
import { TrackingErrorState, TrackingNotFoundState, TrackingSearchingState, TrackingStage } from '../../features/tracking/TrackingStates';
import { WhatsAppIcon, WhatsAppSupportButton } from '../../features/whatsapp/WhatsAppSupport';
import { ImageCarousel } from '../../features/media/ImageCarousel';
import { ShipmentRouteCard } from '../../features/map/ShipmentRouteCard';
import { deriveLifecycleState, displayProgress, interruptionFor, lifecycleLabels } from '../../features/shipments/lifecycle';
import { buildTimeline } from '../../features/shipments/timeline';
import type { TimelineEntry } from '../../features/shipments/timeline';
import { paymentLabels } from '../../features/shipments/types';
import { displayTrackingReference, isTrackingNumber, rememberTrackingNumber, resolveShipmentReference, trackingReferenceFor } from '../../services/trackingService';
import type { ShipmentWithCheckpoints } from '../../types/database';

type Detail = 'package' | 'waybill' | 'map' | null;

const prettyDate = (value?: string | null) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not available';
const prettyTime = (value?: string | null) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const prettyDateTime = (value?: string | null) => value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const isResolved = (value: string) => value.startsWith('http') || value.startsWith('data:') || value.startsWith('/');
const imageUrl = (value: string) => isResolved(value) ? value : supabase.storage.from('shipment-images').getPublicUrl(value).data.publicUrl;
const imagesOf = (shipment: ShipmentWithCheckpoints) => (shipment.images || []).filter(Boolean).map(imageUrl);

function WaybillPreview({ shipment }: { shipment: ShipmentWithCheckpoints }) {
  return <div className="dhl-waybill"><div className="dhl-waybill-head"><img src={brandConfig.logo} alt={brandConfig.appName}/><div><span className="dhl-eyebrow">Shipment summary</span><strong>{displayTrackingReference(shipment)}</strong></div></div><div className="dhl-waybill-grid">
    {[
      ['Tracking number', displayTrackingReference(shipment)], ['Sender', shipment.sender_name], ['Receiver', shipment.receiver_name],
      ['Origin', shipment.pickup_location || 'Not recorded'], ['Destination', shipment.delivery_address],
      ['Package', shipment.package_name || 'Shipment'], ['Transport', shipment.transportation], ['Created', prettyDate(shipment.created_at)],
    ].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
  </div><p className="dhl-muted" style={{ fontSize: 12, marginTop: 15 }}>Preview generated from shipment records. No carrier-issued waybill document is attached to this shipment.</p></div>;
}

function ShipmentFacts({ shipment }: { shipment: ShipmentWithCheckpoints }) {
  const facts = [
    ['Transport', shipment.transportation],
    ['Carrier', [shipment.carrier_role, shipment.driver_name].filter(Boolean).join(' · ') || null],
    ['Payment', paymentLabels[shipment.payment_status || (shipment.paid ? 'paid' : 'unpaid')]],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  return <dl className="dhl-shipment-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

/** Prominent notice for paused, stopped, cancelled and terminated shipments. */
function InterruptionCard({ shipment }: { shipment: ShipmentWithCheckpoints }) {
  const interruption = interruptionFor(shipment);
  const state = deriveLifecycleState(shipment);
  if (state === 'awaiting_takeoff') return <section className="dhl-card dhl-interruption awaiting" role="status"><PlaneTakeoff size={22}/><div><strong>Awaiting takeoff</strong><p>Your shipment is registered and will start moving soon. This page updates as soon as it departs.</p></div></section>;
  if (!interruption) return null;
  return <section className={`dhl-card dhl-interruption ${interruption.state}`} role="status">
    <AlertTriangle size={22}/>
    <div><strong>{interruption.title}</strong>{interruption.reason && <p><span>Reason:</span> {interruption.reason}</p>}{interruption.at && <small><Clock3 size={13}/> Latest update: {prettyDateTime(interruption.at)}</small>}</div>
  </section>;
}

function DetailModal({ detail, onClose, shipment }: { detail: Detail; onClose: () => void; shipment: ShipmentWithCheckpoints }) {
  useEffect(() => {
    if (!detail) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, onClose]);
  if (!detail) return null;
  const title = detail === 'package' ? 'Package Photos' : detail === 'waybill' ? 'Waybill Preview' : 'Shipment Route';
  return <div className="dhl-modal-wrap" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="dhl-modal" role="dialog" aria-modal="true" aria-label={title}><div className="dhl-modal-head"><h2>{title}</h2><button className="dhl-icon-button" onClick={onClose} aria-label="Close preview"><X size={22}/></button></div>
    {detail === 'package' && <ImageCarousel images={imagesOf(shipment)} aspect="16 / 11" />}
    {detail === 'waybill' && <WaybillPreview shipment={shipment}/>}
    {detail === 'map' && <ShipmentRouteCard shipment={shipment} height={380} />}
  </section></div>;
}

function TimelineEvent({ entry, latest }: { entry: TimelineEntry; latest: boolean }) {
  return <article className={`dhl-event ${entry.tone}`}>
    <span className="dhl-event-node">{entry.tone === 'alert' ? <AlertTriangle size={12}/> : latest ? <Truck size={13}/> : <Check size={13}/>}</span>
    <div className="dhl-event-time"><strong>{prettyTime(entry.at)}</strong><small>{prettyDate(entry.at)}</small></div>
    <div className="dhl-event-body"><strong>{entry.title}</strong>{(entry.location || entry.detail) && <p>{[entry.location, entry.detail].filter(Boolean).join(' · ')}</p>}{latest && <span className="dhl-eyebrow" style={{ marginTop: 7 }}>Latest update</span>}</div>
  </article>;
}

function SummaryCard({ shipment, now }: { shipment: ShipmentWithCheckpoints; now: number }) {
  const state = deriveLifecycleState(shipment);
  const trackingRef = trackingReferenceFor(shipment);
  return <section className="dhl-card dhl-result-summary"><div className="dhl-result-top"><div><span className="dhl-eyebrow">Tracking number</span><button className="dhl-text-button" onClick={() => navigator.clipboard?.writeText(trackingRef)} title="Copy tracking number"><strong className="dhl-tracking-reference">{displayTrackingReference(shipment)}</strong><Copy size={16}/></button></div><StatusBadge status={lifecycleLabels[state]}/></div><div className="dhl-result-delivery"><div><small>ESTIMATED DELIVERY</small><strong>{estimatedDelivery(shipment)}</strong></div><Truck size={26}/></div><ShipmentProgress value={displayProgress(shipment, now)}/></section>;
}

function Timeline({ shipment, now, openDetail }: { shipment: ShipmentWithCheckpoints; now: number; openDetail: (detail: Detail) => void }) {
  const { history, upcoming } = buildTimeline(shipment);
  return <div className="dhl-container"><PageHeading title="Tracking Timeline" backTo={`/track/${encodeURIComponent(trackingReferenceFor(shipment))}`}/><SummaryCard shipment={shipment} now={now}/><InterruptionCard shipment={shipment}/>
    <div className="dhl-timeline-grid"><section className="dhl-card dhl-timeline-card"><span className="dhl-eyebrow">Updates</span><h2>Tracking Timeline</h2>
      {upcoming.length > 0 && <div className="dhl-timeline-upcoming"><small>Upcoming</small>{upcoming.map(entry => <p key={entry.id}>{entry.title}{entry.location ? ` · ${entry.location}` : ''}</p>)}</div>}
      {history.length ? history.map((entry, index) => <TimelineEvent key={entry.id} entry={entry} latest={index === 0}/>) : <p className="dhl-muted">No updates have been recorded yet.</p>}
    </section>
    <aside className="dhl-context-stack"><section className="dhl-card dhl-context-card"><span className="dhl-eyebrow">Shipment</span><h3>Package Details</h3><p>{shipment.package_name || 'Package details are not available.'}</p><ImageCarousel images={imagesOf(shipment)}/><ShipmentFacts shipment={shipment}/></section>
    <section className="dhl-card dhl-context-card"><span className="dhl-eyebrow">Documents</span><h3>Waybill & Documents</h3><p>Shipment summary · {displayTrackingReference(shipment)}</p><button className="dhl-secondary-button" onClick={() => openDetail('waybill')}>View Waybill Preview <ChevronRight size={16}/></button></section>
    <section className="dhl-card dhl-context-card"><span className="dhl-eyebrow">Route</span><h3>Shipment Route</h3><ShipmentRouteCard shipment={shipment} height={220}/><button className="dhl-secondary-button" onClick={() => openDetail('map')}>Expand Route <ChevronRight size={16}/></button></section></aside></div></div>;
}

function estimatedDelivery(shipment: ShipmentWithCheckpoints) {
  if (shipment.estimated_delivery_at) return prettyDate(shipment.estimated_delivery_at);
  if (shipment.countdown_start_time && shipment.countdown_duration) return prettyDate(new Date(new Date(shipment.countdown_start_time).getTime() + shipment.countdown_duration * 1000).toISOString());
  return 'Not provided';
}

export default function TrackShipment() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { shipment, loading, notFound, retry } = useShipmentWithCheckpoints(id);
  const [now, setNow] = useState(() => Date.now());
  const [detail, setDetail] = useState<Detail>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const view = params.get('view'); setDetail(view === 'package' || view === 'waybill' || view === 'map' ? view : null); }, [params]);
  // Keep the URL on the customer-facing number when an older UUID link was used.
  useEffect(() => {
    if (!shipment?.tracking_number) return;
    rememberTrackingNumber(shipment.tracking_number);
    if (id === shipment.tracking_number) return;
    const suffix = location.pathname.endsWith('/timeline') ? '/timeline' : '';
    navigate(`/track/${shipment.tracking_number}${suffix}${location.search}`, { replace: true });
  }, [shipment?.tracking_number, id, location.pathname, location.search, navigate]);
  const openDetail = (next: Detail) => setDetail(next);
  const reference = resolveShipmentReference(id)?.value || id;
  if (loading) return <TrackingStage><p className="dhl-visually-hidden" role="status">Searching for your shipment</p><TrackingSearchingState trackingNumber={isTrackingNumber(reference) ? reference : undefined}/></TrackingStage>;
  // Unpublished (scheduled) shipments are not publicly trackable.
  if (notFound || !id || (shipment && shipment.is_published === false)) return <TrackingStage><p className="dhl-visually-hidden" role="status">Shipment not found</p><TrackingNotFoundState trackingNumber={isTrackingNumber(reference) ? reference : ''}/></TrackingStage>;
  if (!shipment) return <TrackingStage><p className="dhl-visually-hidden" role="status">We’re having trouble checking this shipment right now.</p><TrackingErrorState onRetry={retry}/></TrackingStage>;
  const trackingRef = trackingReferenceFor(shipment);
  if (location.pathname.endsWith('/timeline')) return <><Timeline shipment={shipment} now={now} openDetail={openDetail}/><DetailModal detail={detail} onClose={() => setDetail(null)} shipment={shipment}/></>;
  const latest = buildTimeline(shipment).history[0];
  const state = deriveLifecycleState(shipment);
  return <div className="dhl-container"><PageHeading title="Shipment Tracking" backTo="/track"/><SummaryCard shipment={shipment} now={now}/><InterruptionCard shipment={shipment}/>
    <div className="dhl-result-grid"><section className="dhl-card dhl-latest"><span className="dhl-eyebrow">Latest update</span><h2>{latest ? latest.title : lifecycleLabels[state]}</h2><p className="dhl-muted">{latest ? `${[latest.location, latest.detail].filter(Boolean).join(' · ')}${latest.location || latest.detail ? ' · ' : ''}Recorded ${prettyDate(latest.at)} at ${prettyTime(latest.at)}` : 'Shipment details are available below.'}</p><div className="dhl-summary-pair"><div className="dhl-summary-cell"><small>DESTINATION</small><strong>{shipment.delivery_address}</strong></div><div className="dhl-summary-cell"><small>RECEIVER</small><strong>{shipment.receiver_name}</strong></div></div><Link className="dhl-primary-button" to={`/track/${encodeURIComponent(trackingRef)}/timeline`}>View Tracking Timeline <ChevronRight size={18}/></Link></section>
    <aside className="dhl-card dhl-shortcuts"><h3>Shipment details</h3><button onClick={() => openDetail('package')}><ImageIcon size={19}/> Package Photos <ChevronRight size={16}/></button><button onClick={() => openDetail('waybill')}><FileText size={19}/> Waybill <ChevronRight size={16}/></button><button onClick={() => openDetail('map')}><Map size={19}/> Shipment Route <ChevronRight size={16}/></button><Link to={`/chat?id=${encodeURIComponent(trackingRef)}`}><Package size={19}/> Shipment Support <ChevronRight size={16}/></Link><WhatsAppSupportButton trackingId={shipment.tracking_number || null} className="dhl-shortcut-whatsapp"><WhatsAppIcon size={19}/> WhatsApp Support <ChevronRight size={16}/></WhatsAppSupportButton><ShipmentFacts shipment={shipment}/></aside></div>
    <div className="dhl-result-media"><section className="dhl-card dhl-result-route"><span className="dhl-eyebrow">Route</span><h2>Shipment Route</h2><ShipmentRouteCard shipment={shipment} height={320}/></section><section className="dhl-card dhl-result-photos"><span className="dhl-eyebrow">Package</span><h2>{shipment.package_name || 'Package photos'}</h2><ImageCarousel images={imagesOf(shipment)}/></section></div>
    <DetailModal detail={detail} onClose={() => setDetail(null)} shipment={shipment}/></div>;
}
