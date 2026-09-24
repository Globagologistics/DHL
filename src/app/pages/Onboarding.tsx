import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { brandConfig } from '../../config/brand';

export default function Onboarding() {
  return (
    <section className="dhl-welcome dhl-welcome-cinematic">
      <picture className="dhl-welcome-photo" aria-hidden="true">
        <source
          media="(min-width: 900px) and (orientation: landscape)"
          srcSet={brandConfig.cinematicLandscape.webp}
          type="image/webp"
        />
        <source
          media="(min-width: 900px) and (orientation: landscape)"
          srcSet={brandConfig.cinematicLandscape.fallback}
          type="image/jpeg"
        />
        <source srcSet={brandConfig.cinematicPortrait.webp} type="image/webp" />
        <img
          src={brandConfig.cinematicPortrait.fallback}
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="dhl-welcome-shade" aria-hidden="true" />
      <div className="dhl-welcome-copy">
        <Link className="dhl-welcome-logo" to="/home" aria-label={`${brandConfig.appName} home`}>
          <img src={brandConfig.cinematicLogo} alt={brandConfig.appName} />
        </Link>
        <div className="dhl-welcome-content">
          <span className="dhl-eyebrow">The world on time</span>
          <h1>
            <span>Delivering</span>
            <span>possibilities.</span>
            <span className="dhl-welcome-highlight">Worldwide.</span>
          </h1>
          <p>Real-time shipment updates, delivery progress and customer support in one seamless experience.</p>
          <Link to="/home" className="dhl-welcome-cta">
            Get Started <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
