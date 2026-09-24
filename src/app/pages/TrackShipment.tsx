import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, Copy, FileText, Image as ImageIcon, Map, Package, Truck, X } from 'lucide-react';
import { PageHeading, ShipmentProgress, StatusBadge } from '../components/customer/CustomerShell';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import { getShipmentJourneyState, formatJourneyStatus } from '../utils/shipmentJourney';
import { supabase } from '../../lib/supabase';
import { brandConfig } from '../../config/brand';
import { TrackingErrorState, TrackingNotFoundState, TrackingSearchingState, TrackingStage } from '../../features/tracking/TrackingStates';
import { WhatsAppIcon, WhatsAppSupportButton } from '../../features/whatsapp/WhatsAppSupport';
import { displayTrackingReference, isTrackingNumber, rememberTrackingNumber, resolveShipmentReference, trackingReferenceFor } from '../../services/trackingService';
import type { Checkpoint, ShipmentWithCheckpoints } from '../../types/database';

type Detail = 'package' | 'waybill' | 'map' | null;

const prettyDate = (value?: string | null) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not available';
const prettyTime = (value?: string | null) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const isResolved = (value: string) => value.startsWith('http') || value.startsWith('data:') || value.startsWith('/');
const imageUrl = (value: string) => isResolved(value) ? value : supabase.storage.from('shipment-images').getPublicUrl(value).data.publicUrl;
const routeImageUrl = (value: string) => isResolved(value) ? value : supabase.storage.from('route-screenshots').getPublicUrl(value).data.publicUrl;

function RouteGraphic({ shipment }: { shipment: ShipmentWithCheckpoints }) {
  if (shipment.route_screenshot_url) return <img className="dhl-package-preview" src={routeImageUrl(shipment.route_screenshot_url)} alt="Recorded shipment route"/>;
  return <div className="dhl-route-graphic" role="img" aria-label={`Illustrative route from ${shipment.pickup_location || 'origin'} to ${shipment.delivery_address}`}><svg viewBox="0 0 500 200" preserveAspectRatio="none"><path d="M32 150 C125 42 182 142 250 99 S383 119 468 39"/></svg><div className="dhl-route-labels"><span>{shipment.pickup_location || 'Origin'}</span><span>{shipment.delivery_address}</span></div></div>;
}

function WaybillPreview({ shipment }: { shipment: ShipmentWithCheckpoints }) {
  return <div className="dhl-waybill"><div className="dhl-waybill-head"><img src={brandConfig.logo} alt={brandConfig.appName}/><div><span className="dhl-eyebrow">Shipment summary</span><strong>{displayTrackingReference(shipment)}</strong></div></div><div className="dhl-waybill-grid">
    {[
      ['Tracking number', displayTrackingReference(shipment)], ['Sender', shipment.sender_name], ['Recipient', shipment.receiver_name],
      ['Origin', shipment.pickup_location || 'Not recorded'], ['Destination', shipment.delivery_address],
      ['Package', shipment.package_name || 'Shipment'], ['Transport', shipment.transportation], ['Created', prettyDate(shipment.created_at)],
    ].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
  </div><p className="dhl-muted" style={{ fontSize: 12, marginTop: 15 }}>Preview generated from shipment records. No carrier-issued waybill document is attached to this shipment.</p></div>;
}

function ShipmentFacts({ shipment }: { shipment: ShipmentWithCheckpoints }) {
  const facts = [
    ['Transport', shipment.transportation],
    ['Payment', shipment.payment_status || (shipment.paid ? 'Paid' : 'Unpaid')],
    ['Cost', shipment.cost != null ? `${shipment.currency || 'USD'} ${Number(shipment.cost).toFixed(2)}` : null],
    ['Vehicle', shipment.vehicle_type || null],
    ['Driver', shipment.driver_name || null],
    ['Driver experience', shipment.driver_experience || null],
    ['Hold reason', shipment.customer_status_reason || shipment.stop_reason || null],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  if (!facts.length) return null;
  return <dl className="dhl-shipment-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function DetailModal({ detail, onClose, shipment, images }: { detail: Detail; onClose: () => void; shipment: ShipmentWithCheckpoints; images: string[] }) {
  useEffect(() => {
    if (!detail) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, onClose]);
  if (!detail) return null;
  const title = detail === 'package' ? 'Package Image' : detail === 'waybill' ? 'Waybill Preview' : 'Shipment Route';
  return <div className="dhl-modal-wrap" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="dhl-modal" role="dialog" aria-modal="true" aria-label={title}><div className="dhl-modal-head"><h2>{title}</h2><button className="dhl-icon-button" onClick={onClose} aria-label="Close preview"><X size={22}/></button></div>
    {detail === 'package' && (images.length ? <div style={{ display: 'grid', gap: 12 }}>{images.map((src, index) => <img src={src} alt={`Package image ${index + 1}`} key={`${src}-${index}`}/>)}</div> : <p className="dhl-muted">No package image is available for this shipment.</p>)}
    {detail === 'waybill' && <WaybillPreview shipment={shipment}/>}
    {detail === 'map' && <><RouteGraphic shipment={shipment}/>{!shipment.route_screenshot_url && <p className="dhl-muted">Illustrative route based on the recorded origin and destination. Live map coordinates are not available.</p>}</>}
  </section></div>;
}

function Timeline({ shipment, status, progress, openDetail }: { shipment: ShipmentWithCheckpoints; status: string; progress: number; openDetail: (detail: Detail) => void }) {
  const events = [...(shipment.checkpoints || [])].sort((a, b) => b.checkpoint_order - a.checkpoint_order);
  const images = (shipment.images || []).filter(Boolean).map(imageUrl);
  return <div className="dhl-container"><PageHeading title="Tracking Timeline" backTo={`/track/${encodeURIComponent(trackingReferenceFor(shipment))}`}/><section className="dhl-card dhl-result-summary"><div className="dhl-result-top"><div><span className="dhl-eyebrow">Tracking number</span><strong className="dhl-tracking-reference">{displayTrackingReference(shipment)}</strong></div><StatusBadge status={status}/></div><div className="dhl-result-delivery"><div><small>ESTIMATED DELIVERY</small><strong>{estimatedDelivery(shipment)}</strong></div><Truck size={26}/></div><ShipmentProgress value={progress}/></section>
    <div className="dhl-timeline-grid"><section className="dhl-card dhl-timeline-card"><span className="dhl-eyebrow">Live updates</span><h2>Tracking Timeline</h2>{events.length ? events.map((event, index) => <article className="dhl-event" key={event.id}><span className="dhl-event-node">{index === 0 ? <Truck size={13}/> : <Check size={13}/>}</span><div className="dhl-event-time"><strong>{prettyTime(event.created_at)}</strong><small>{prettyDate(event.created_at)}</small></div><div className="dhl-event-body"><strong>{checkpointLabel(event)}</strong><p>{event.location}</p>{index === 0 && <span className="dhl-eyebrow" style={{ marginTop: 7 }}>Latest recorded checkpoint</span>}</div></article>) : <p className="dhl-muted">No checkpoints have been recorded yet.</p>}</section>
    <aside className="dhl-context-stack"><section className="dhl-card dhl-context-card"><span className="dhl-eyebrow">Shipment</span><h3>Package Details</h3><p>{shipment.package_name || 'Package details are not available.'}</p>{images[0] && <button onClick={() => openDetail('package')} aria-label="View package image"><img className="dhl-package-preview" src={images[0]} alt="Shipment package"/></button>}<ShipmentFacts shipment={shipment}/><button className="dhl-secondary-button" onClick={() => openDetail('package')}>View Package Image <ChevronRight size={16}/></button></section>
    <section className="dhl-card dhl-context-card"><span className="dhl-eyebrow">Documents</span><h3>Waybill & Documents</h3><p>Shipment summary · {displayTrackingReference(shipment)}</p><button className="dhl-secondary-button" onClick={() => openDetail('waybill')}>View Waybill Preview <ChevronRight size={16}/></button></section>
    <section className="dhl-card dhl-context-card"><span className="dhl-eyebrow">Route</span><h3>Shipment Route</h3><RouteGraphic shipment={shipment}/><button className="dhl-secondary-button" onClick={() => openDetail('map')}>Expand Route <ChevronRight size={16}/></button></section></aside></div></div>;
}

function checkpointLabel(checkpoint: Checkpoint) {
  return checkpoint.status === 'completed' ? 'Checkpoint completed' : checkpoint.status === 'current' ? 'Shipment at checkpoint' : 'Upcoming checkpoint';
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
  const images = useMemo(() => (shipment?.images || []).filter(Boolean).map(imageUrl), [shipment?.images]);
  const journey = shipment ? getShipmentJourneyState(shipment, now) : null;
  const status = journey ? formatJourneyStatus(journey.status) : '';
  const reference = resolveShipmentReference(id)?.value || id;
  if (loading) return <TrackingStage><p className="dhl-visually-hidden" role="status">Searching for your shipment</p><TrackingSearchingState trackingNumber={isTrackingNumber(reference) ? reference : undefined}/></TrackingStage>;
  if (notFound || !id) return <TrackingStage><p className="dhl-visually-hidden" role="status">Shipment not found</p><TrackingNotFoundState trackingNumber={isTrackingNumber(reference) ? reference : ''}/></TrackingStage>;
  if (!shipment) return <TrackingStage><p className="dhl-visually-hidden" role="status">We’re having trouble checking this shipment right now.</p><TrackingErrorState onRetry={retry}/></TrackingStage>;
  const trackingRef = trackingReferenceFor(shipment);
  if (location.pathname.endsWith('/timeline')) return <><Timeline shipment={shipment} status={status} progress={journey?.progress || 0} openDetail={openDetail}/><DetailModal detail={detail} onClose={() => setDetail(null)} shipment={shipment} images={images}/></>;
  const latest = [...(shipment.checkpoints || [])].filter(item => item.status !== 'pending').sort((a, b) => b.checkpoint_order - a.checkpoint_order)[0] || [...(shipment.checkpoints || [])].sort((a, b) => b.checkpoint_order - a.checkpoint_order)[0];
  return <div className="dhl-container"><PageHeading title="Shipment Tracking" backTo="/track"/><section className="dhl-card dhl-result-summary"><div className="dhl-result-top"><div><span className="dhl-eyebrow">Tracking number</span><button className="dhl-text-button" onClick={() => navigator.clipboard?.writeText(trackingRef)} title="Copy tracking number"><strong className="dhl-tracking-reference">{displayTrackingReference(shipment)}</strong><Copy size={16}/></button></div><StatusBadge status={status}/></div><div className="dhl-result-delivery"><div><small>ESTIMATED DELIVERY</small><strong>{estimatedDelivery(shipment)}</strong></div><Truck size={26}/></div><ShipmentProgress value={journey?.progress || 0}/></section>
    <div className="dhl-result-grid"><section className="dhl-card dhl-latest"><span className="dhl-eyebrow">Latest update</span><h2>{latest ? checkpointLabel(latest) : status}</h2><p className="dhl-muted">{latest ? `${latest.location} · Recorded ${prettyDate(latest.created_at)} at ${prettyTime(latest.created_at)}` : 'Shipment details are available below.'}</p><div className="dhl-summary-pair"><div className="dhl-summary-cell"><small>DESTINATION</small><strong>{shipment.delivery_address}</strong></div><div className="dhl-summary-cell"><small>RECIPIENT</small><strong>{shipment.receiver_name}</strong></div></div><Link className="dhl-primary-button" to={`/track/${encodeURIComponent(trackingRef)}/timeline`}>View Tracking Timeline <ChevronRight size={18}/></Link></section>
    <aside className="dhl-card dhl-shortcuts"><h3>Shipment details</h3><button onClick={() => openDetail('package')}><ImageIcon size={19}/> Package Image <ChevronRight size={16}/></button><button onClick={() => openDetail('waybill')}><FileText size={19}/> Waybill <ChevronRight size={16}/></button><button onClick={() => openDetail('map')}><Map size={19}/> Shipment Route <ChevronRight size={16}/></button><Link to={`/chat?id=${encodeURIComponent(trackingRef)}`}><Package size={19}/> Shipment Support <ChevronRight size={16}/></Link><WhatsAppSupportButton trackingId={shipment.tracking_number || null} className="dhl-shortcut-whatsapp"><WhatsAppIcon size={19}/> WhatsApp Support <ChevronRight size={16}/></WhatsAppSupportButton><ShipmentFacts shipment={shipment}/></aside></div><DetailModal detail={detail} onClose={() => setDetail(null)} shipment={shipment} images={images}/></div>;
}
