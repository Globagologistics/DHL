import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, Headphones, PackageSearch, PackageX, PencilLine, RotateCcw, Truck, WifiOff } from 'lucide-react';
import { brandConfig } from '../../config/brand';
import { formatTrackingNumber } from '../../services/trackingService';
import { WhatsAppIcon, WhatsAppSupportButton } from '../whatsapp/WhatsAppSupport';

/**
 * Track page frame in the Home design language: a rounded cinematic card over
 * the DHL logistics image, a readability gradient, and the tracking content
 * (form or a result sheet) toward the bottom.
 */
export function TrackingStage({ children, below }: { children: ReactNode; below?: ReactNode }) {
  return <section className="dhl-track-page">
    <div className="dhl-track-hero">
      <picture className="dhl-track-hero-media" aria-hidden="true">
        <source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.webp} type="image/webp" />
        <source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.fallback} type="image/jpeg" />
        <source srcSet={brandConfig.cinematicPortrait.webp} type="image/webp" />
        <img src={brandConfig.cinematicPortrait.fallback} alt="" decoding="async" />
      </picture>
      <div className="dhl-track-hero-shade" aria-hidden="true" />
      <div className="dhl-track-hero-inner">
        <div className="dhl-track-hero-copy">
          <span className="dhl-track-eyebrow">Track &amp; trace</span>
          <h1>Track your shipment</h1>
          <p>Enter your 12-digit tracking number to view the latest status, route and delivery estimate.</p>
        </div>
        <div className="dhl-track-hero-action">{children}</div>
      </div>
      <JourneyAside />
    </div>
    {below}
  </section>;
}

/** Desktop-only composition on the image side: the milestones customers will see. */
function JourneyAside() {
  const steps = ['Picked up', 'In transit', 'Out for delivery', 'Delivered'];
  return <div className="dhl-track-hero-aside" aria-hidden="true">
    <span className="dhl-track-aside-icon"><Truck size={18} /></span>
    <strong>Every milestone, as it happens</strong>
    <ol>{steps.map((step, index) => <li key={step} className={index < 1 ? 'done' : index === 1 ? 'current' : ''}><i>{index < 1 ? <Check size={11} /> : null}</i>{step}</li>)}</ol>
  </div>;
}

function NumberChip({ label, value }: { label: string; value: string }) {
  return <div className="dhl-track-number-chip"><small>{label}</small><strong>{formatTrackingNumber(value)}</strong></div>;
}

export function TrackingSearchingState({ trackingNumber }: { trackingNumber?: string }) {
  return <div className="dhl-track-sheet"><div className="dhl-track-state searching">
    <span className="dhl-track-state-icon searching" aria-hidden="true"><PackageSearch size={30} /><i /></span>
    <h2>Searching for your shipment</h2>
    <p>Checking our shipment network…</p>
    {trackingNumber && <NumberChip label="Tracking number" value={trackingNumber} />}
    <div className="dhl-track-progress" aria-hidden="true"><span /></div>
  </div></div>;
}

export function TrackingFoundState({ trackingNumber }: { trackingNumber: string }) {
  return <div className="dhl-track-sheet"><div className="dhl-track-state found">
    <span className="dhl-track-state-icon found" aria-hidden="true"><CheckCircle2 size={30} /></span>
    <h2>Shipment found</h2>
    <p>Opening your tracking details…</p>
    <NumberChip label="Tracking number" value={trackingNumber} />
  </div></div>;
}

/** The request completed and no shipment matches. Never used for technical failures. */
export function TrackingNotFoundState({ trackingNumber, onTryAgain, onEdit }: { trackingNumber: string; onTryAgain?: () => void; onEdit?: () => void }) {
  return <div className="dhl-track-sheet"><div className="dhl-track-state not-found">
    <span className="dhl-track-state-icon not-found" aria-hidden="true"><PackageX size={30} /></span>
    <h2>Shipment not found</h2>
    <p>We couldn’t find a shipment matching this tracking number.</p>
    <p className="dhl-track-state-note">Please confirm the 12-digit tracking number shown on your receipt or contact the sender for the correct shipment reference.</p>
    <p className="dhl-track-state-hint">Make sure there are no missing or incorrect digits.</p>
    {trackingNumber && <NumberChip label="Tracking number entered" value={trackingNumber} />}
    <div className="dhl-track-state-actions">
      {onTryAgain ? <button type="button" className="dhl-primary-button" onClick={onTryAgain}><RotateCcw size={17} /> Try Again</button> : <Link className="dhl-primary-button" to={trackingNumber ? `/track?id=${trackingNumber}` : '/track'}><RotateCcw size={17} /> Try Again</Link>}
      {onEdit ? <button type="button" className="dhl-secondary-button" onClick={onEdit}><PencilLine size={17} /> Edit Tracking Number</button> : <Link className="dhl-secondary-button" to="/track"><PencilLine size={17} /> Edit Tracking Number</Link>}
      <Link className="dhl-secondary-button" to="/chat"><Headphones size={17} /> Customer Support</Link>
      <WhatsAppSupportButton trackingId={trackingNumber || null} className="dhl-whatsapp-action"><WhatsAppIcon size={18} /> WhatsApp Support</WhatsAppSupportButton>
    </div>
  </div></div>;
}

/** Network failure, timeout or server error. Never used when the lookup simply found nothing. */
export function TrackingErrorState({ onRetry, onBack }: { onRetry: () => void; onBack?: () => void }) {
  return <div className="dhl-track-sheet"><div className="dhl-track-state error">
    <span className="dhl-track-state-icon error" aria-hidden="true"><WifiOff size={30} /></span>
    <h2>We’re having trouble checking this shipment right now.</h2>
    <p>This is a connection problem on our side, not a problem with your tracking number. Please try again.</p>
    <div className="dhl-track-state-actions">
      <button type="button" className="dhl-primary-button" onClick={onRetry}><RotateCcw size={17} /> Try Again</button>
      {onBack ? <button type="button" className="dhl-secondary-button" onClick={onBack}><PencilLine size={17} /> Edit Tracking Number</button> : <Link className="dhl-secondary-button" to="/chat"><Headphones size={17} /> Customer Support</Link>}
    </div>
  </div></div>;
}
