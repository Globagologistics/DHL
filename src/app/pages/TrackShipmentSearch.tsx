import { useEffect, useId, useRef } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Clock3, Headphones, PackageSearch, ReceiptText, Route, Search } from 'lucide-react';
import { TrackingNumberInput } from '../../features/tracking/TrackingNumberInput';
import { TrackingErrorState, TrackingFoundState, TrackingNotFoundState, TrackingSearchingState, TrackingStage } from '../../features/tracking/TrackingStates';
import { useTrackingLookup } from '../../features/tracking/useTrackingLookup';
import type { TrackingPhase } from '../../features/tracking/useTrackingLookup';
import { WhatsAppSupportButton } from '../../features/whatsapp/WhatsAppSupport';
import { TRACKING_NUMBER_LENGTH, isShipmentRecordId } from '../../services/trackingService';

/** Hands off to the result page after the "Shipment found" confirmation. */
const FOUND_HOLD_MS = 650;

const announcements: Partial<Record<TrackingPhase, string>> = {
  searching: 'Searching for your shipment',
  found: 'Shipment found. Opening tracking details.',
  not_found: 'Shipment not found',
  error: 'We’re having trouble checking this shipment right now.',
};

export default function TrackShipmentSearch() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fieldId = useId();
  const input = useRef<HTMLInputElement>(null);
  const handoff = useRef<number | null>(null);
  const lookup = useTrackingLookup({
    onFound: (shipment, digits) => {
      handoff.current = window.setTimeout(() => navigate(`/track/${encodeURIComponent(shipment.trackingNumber || digits)}`), FOUND_HOLD_MS);
    },
  });
  const initial = params.get('id')?.trim() || '';
  const { start } = lookup;

  useEffect(() => { if (initial && !isShipmentRecordId(initial)) start(initial); }, [initial, start]);
  useEffect(() => () => { if (handoff.current !== null) window.clearTimeout(handoff.current); }, []);

  // Older shared links used the shipment record id.
  if (isShipmentRecordId(initial)) return <Navigate to={`/track/${encodeURIComponent(initial)}`} replace />;

  const { digits, phase, searchedNumber } = lookup;
  const backToForm = () => { lookup.reset(); window.setTimeout(() => input.current?.focus(), 0); };
  const helperId = `${fieldId}-helper`;
  const helper = phase === 'incomplete'
    ? { tone: 'error', text: 'Enter the complete 12-digit tracking number.' }
    : phase === 'typing'
      ? { tone: 'neutral', text: 'Tracking numbers contain 12 digits.' }
      : phase === 'ready'
        ? { tone: 'ready', text: 'Checking automatically…' }
        : { tone: 'neutral', text: 'You’ll find it on your receipt or shipment confirmation email.' };

  const panel = phase === 'searching' ? <TrackingSearchingState trackingNumber={searchedNumber} />
    : phase === 'found' ? <TrackingFoundState trackingNumber={searchedNumber} />
      : phase === 'not_found' ? <TrackingNotFoundState trackingNumber={searchedNumber} onTryAgain={backToForm} />
        : phase === 'error' ? <TrackingErrorState onRetry={lookup.retry} onBack={backToForm} />
          : null;

  return <TrackingStage below={<TrackingHelp />}>
    <p className="dhl-visually-hidden" role="status" aria-live="polite">{announcements[phase] || ''}</p>
    {panel || <div className="dhl-track-form-view">
      <div className="dhl-track-heading">
        <span className="dhl-track-heading-icon" aria-hidden="true"><PackageSearch size={28} /></span>
        <div><span className="dhl-eyebrow">Track &amp; trace</span><h1>Track your shipment</h1></div>
      </div>
      <p className="dhl-track-intro">Enter your 12-digit tracking number to see the latest status, route and delivery estimate.</p>
      <form className="dhl-track-form" noValidate onSubmit={event => { event.preventDefault(); if (!lookup.submit()) input.current?.focus(); }}>
        <label className="dhl-track-label" htmlFor={fieldId}>Tracking number</label>
        <div className={`dhl-track-field${phase === 'incomplete' ? ' invalid' : ''}${phase === 'ready' ? ' ready' : ''}`}>
          <Search size={20} aria-hidden="true" />
          <TrackingNumberInput id={fieldId} ref={input} value={digits} onValueChange={lookup.setDigits} placeholder="0000 0000 0000" aria-describedby={helperId} aria-invalid={phase === 'incomplete'} autoFocus={!initial} />
          <span className="dhl-track-count" aria-hidden="true">{digits.length}/{TRACKING_NUMBER_LENGTH}</span>
        </div>
        <p id={helperId} className={`dhl-track-helper ${helper.tone}`} role={phase === 'incomplete' ? 'alert' : undefined}>{helper.text}</p>
        <button className="dhl-primary-button dhl-track-submit" type="submit">Track Shipment <ChevronRight size={18} /></button>
      </form>
    </div>}
  </TrackingStage>;
}

function TrackingHelp() {
  return <div className="dhl-track-help">
    <article><span aria-hidden="true"><ReceiptText size={19} /></span><div><strong>Where’s my number?</strong><p>It’s the 12-digit number on your receipt and in your shipment confirmation email.</p></div></article>
    <article><span aria-hidden="true"><Route size={19} /></span><div><strong>Live milestones</strong><p>Follow every checkpoint from pickup to delivery.</p></div></article>
    <article><span aria-hidden="true"><Clock3 size={19} /></span><div><strong>Need help?</strong><div className="dhl-track-help-links"><Link to="/chat"><Headphones size={16} /> Customer Support</Link><WhatsAppSupportButton className="dhl-track-help-whatsapp" /></div></div></article>
  </div>;
}
