import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Headphones, PackageSearch, PackageX, RotateCcw, WifiOff } from 'lucide-react';
import { brandConfig } from '../../config/brand';
import { formatTrackingNumber } from '../../services/trackingService';
import { WhatsAppSupportButton } from '../whatsapp/WhatsAppSupport';

/** Shared frame for the Track page and tracking-result states: yellow band, faded logistics image, white surface. */
export function TrackingStage({ children, below }: { children: ReactNode; below?: ReactNode }) {
  return <section className="dhl-track-stage">
    <div className="dhl-track-band" aria-hidden="true">
      <picture>
        <source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.webp} type="image/webp" />
        <source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.fallback} type="image/jpeg" />
        <source srcSet={brandConfig.cinematicPortrait.webp} type="image/webp" />
        <img src={brandConfig.cinematicPortrait.fallback} alt="" decoding="async" />
      </picture>
    </div>
    <div className="dhl-track-stage-inner">
      <div className="dhl-track-surface">{children}</div>
      {below}
    </div>
  </section>;
}

function NumberChip({ label, value }: { label: string; value: string }) {
  return <div className="dhl-track-number-chip"><small>{label}</small><strong>{formatTrackingNumber(value)}</strong></div>;
}

export function TrackingSearchingState({ trackingNumber }: { trackingNumber?: string }) {
  return <div className="dhl-track-state searching">
    <span className="dhl-track-state-icon searching" aria-hidden="true"><PackageSearch size={30} /><i /></span>
    <h2>Searching for your shipment</h2>
    <p>Checking our shipment network…</p>
    {trackingNumber && <NumberChip label="Tracking number" value={trackingNumber} />}
    <div className="dhl-track-progress" aria-hidden="true"><span /></div>
  </div>;
}

export function TrackingFoundState({ trackingNumber }: { trackingNumber: string }) {
  return <div className="dhl-track-state found">
    <span className="dhl-track-state-icon found" aria-hidden="true"><CheckCircle2 size={30} /></span>
    <h2>Shipment found</h2>
    <p>Opening your tracking timeline…</p>
    <NumberChip label="Tracking number" value={trackingNumber} />
  </div>;
}

export function TrackingNotFoundState({ trackingNumber, onTryAgain }: { trackingNumber: string; onTryAgain?: () => void }) {
  return <div className="dhl-track-state not-found">
    <span className="dhl-track-state-icon not-found" aria-hidden="true"><PackageX size={30} /></span>
    <h2>Shipment not found</h2>
    <p>We couldn’t find a shipment matching this tracking number.</p>
    <p className="dhl-track-state-note">Please confirm the 12-digit tracking number shown on your receipt or contact the sender for the correct shipment reference.</p>
    {trackingNumber && <NumberChip label="Tracking number entered" value={trackingNumber} />}
    <div className="dhl-track-state-actions">
      {onTryAgain ? <button type="button" className="dhl-primary-button" onClick={onTryAgain}><RotateCcw size={17} /> Try Again</button> : <Link className="dhl-primary-button" to="/track"><RotateCcw size={17} /> Try Again</Link>}
      <Link className="dhl-secondary-button" to="/chat"><Headphones size={17} /> Customer Support</Link>
      <WhatsAppSupportButton trackingId={trackingNumber} className="dhl-secondary-button dhl-whatsapp-button" />
    </div>
  </div>;
}

export function TrackingErrorState({ onRetry, onBack }: { onRetry: () => void; onBack?: () => void }) {
  return <div className="dhl-track-state error">
    <span className="dhl-track-state-icon error" aria-hidden="true"><WifiOff size={30} /></span>
    <h2>We’re having trouble checking this shipment right now.</h2>
    <p>This is a connection problem on our side, not a problem with your tracking number. Please try again in a moment.</p>
    <div className="dhl-track-state-actions">
      <button type="button" className="dhl-primary-button" onClick={onRetry}><RotateCcw size={17} /> Try Again</button>
      {onBack ? <button type="button" className="dhl-secondary-button" onClick={onBack}>Edit tracking number</button> : <Link className="dhl-secondary-button" to="/chat"><Headphones size={17} /> Customer Support</Link>}
    </div>
  </div>;
}
