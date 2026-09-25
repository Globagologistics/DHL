import { useEffect, useId, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Headphones, ReceiptText, Route, Search } from 'lucide-react';
import { TrackingNumberInput } from '../../features/tracking/TrackingNumberInput';
import { TrackingErrorState, TrackingFoundState, TrackingNotFoundState, TrackingSearchingState, TrackingStage } from '../../features/tracking/TrackingStates';
import { useTrackingLookup } from '../../features/tracking/useTrackingLookup';
import type { TrackingPhase } from '../../features/tracking/useTrackingLookup';
import { WhatsAppIcon, WhatsAppSupportButton } from '../../features/whatsapp/WhatsAppSupport';
import { trackingCopy } from '../../features/tracking/trackingCopy';
import { TRACKING_NUMBER_LENGTH, isShipmentRecordId } from '../../services/trackingService';

/** Hands off to the result page after the "Shipment found" confirmation. */
const FOUND_HOLD_MS = 650;

const announcements: Partial<Record<TrackingPhase, string>> = {
  searching: trackingCopy.searching,
  found: 'Shipment found. Opening tracking details.',
  not_found: trackingCopy.notFound.title,
  error: trackingCopy.error.title,
};

// Autofocus only with a mouse/trackpad; on phones it would pop the keyboard over the hero.
const finePointer = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;

export default function TrackShipmentSearch() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fieldId = useId();
  const input = useRef<HTMLInputElement>(null);
  const handoff = useRef<number | null>(null);
  const [charWarning, setCharWarning] = useState(false);
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
  const editNumber = () => { lookup.reset(); window.setTimeout(() => { input.current?.focus(); input.current?.select(); }, 0); };
  const helperId = `${fieldId}-helper`;
  const helper = charWarning
    ? { tone: 'error', text: trackingCopy.nonNumeric }
    : phase === 'incomplete'
      ? { tone: 'error', text: trackingCopy.submittedIncomplete }
      : phase === 'typing'
        ? { tone: 'neutral', text: trackingCopy.incomplete }
        : phase === 'ready'
          ? { tone: 'ready', text: 'Checking automatically…' }
          : { tone: 'neutral', text: 'Find it on your receipt or shipment confirmation email.' };

  const sheet = phase === 'searching' ? <TrackingSearchingState trackingNumber={searchedNumber} />
    : phase === 'found' ? <TrackingFoundState trackingNumber={searchedNumber} />
      : phase === 'not_found' ? <TrackingNotFoundState trackingNumber={searchedNumber} onTryAgain={lookup.retry} onEdit={editNumber} />
        : phase === 'error' ? <TrackingErrorState onRetry={lookup.retry} onBack={editNumber} />
          : null;

  return <TrackingStage below={<TrackingHelp trackingId={digits.length === TRACKING_NUMBER_LENGTH ? digits : null} />}>
    <p className="dhl-visually-hidden" role="status" aria-live="polite">{announcements[phase] || ''}</p>
    {sheet || <form className="dhl-track-form" noValidate onSubmit={event => { event.preventDefault(); if (!lookup.submit()) input.current?.focus(); }}>
      <label className="dhl-visually-hidden" htmlFor={fieldId}>Tracking number</label>
      <div className="dhl-track-bar">
        <div className={`dhl-track-field${phase === 'incomplete' || charWarning ? ' invalid' : ''}${phase === 'ready' ? ' ready' : ''}`}>
          <Search size={20} aria-hidden="true" />
          <TrackingNumberInput id={fieldId} ref={input} value={digits} onRejectedInput={() => setCharWarning(true)} onValueChange={value => { if (value !== digits) setCharWarning(false); lookup.setDigits(value); }} placeholder="12-digit tracking number" aria-describedby={helperId} aria-invalid={phase === 'incomplete' || charWarning} autoFocus={!initial && finePointer} />
          <span className="dhl-track-count" aria-hidden="true">{digits.length}/{TRACKING_NUMBER_LENGTH}</span>
        </div>
        <button className="dhl-primary-button dhl-track-submit" type="submit">Track Shipment <ChevronRight size={18} /></button>
      </div>
      <p id={helperId} className={`dhl-track-helper ${helper.tone}`} role={helper.tone === 'error' ? 'alert' : undefined}>{helper.text}</p>
    </form>}
  </TrackingStage>;
}

function TrackingHelp({ trackingId }: { trackingId: string | null }) {
  return <div className="dhl-track-help">
    <article><span className="dhl-track-help-icon" aria-hidden="true"><ReceiptText size={19} /></span><div><strong>Where’s my tracking number?</strong><p>Your 12-digit tracking number can be found on your shipment confirmation or receipt.</p></div></article>
    <article><span className="dhl-track-help-icon" aria-hidden="true"><Route size={19} /></span><div><strong>Live milestones</strong><p>Follow your shipment as it moves through the delivery network.</p></div></article>
    <article className="dhl-track-help-support"><span className="dhl-track-help-icon" aria-hidden="true"><Headphones size={19} /></span><div><strong>Need help?</strong><p>Talk to our shipment support team.</p><div className="dhl-track-help-actions"><Link className="dhl-secondary-button" to="/chat"><Headphones size={16} /> Customer Support</Link><WhatsAppSupportButton trackingId={trackingId} className="dhl-whatsapp-action"><WhatsAppIcon size={17} /> WhatsApp Support</WhatsAppSupportButton></div></div></article>
  </div>;
}
