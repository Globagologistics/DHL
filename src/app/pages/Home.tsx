import { Link } from 'react-router-dom';
import { ChevronRight, Headphones, MapPin, Package, Search } from 'lucide-react';
import { TrackingForm } from '../components/customer/CustomerShell';
import { brandConfig } from '../../config/brand';

const actions = [
  { title: 'Track Shipment', description: 'Follow your shipment’s journey', icon: Search, to: '/track', tone: 'track' },
  { title: 'Send Shipment', description: 'Shipment services', icon: Package, to: '/send-shipment', tone: 'send' },
  { title: 'Customer Support', description: 'Get help with your delivery', icon: Headphones, to: '/chat', tone: 'support' },
  { title: 'Service Points', description: 'Find a location near you', icon: MapPin, to: '/locations', tone: 'locations' },
];

export default function Home() {
  return (
    <>
      <section className="dhl-home-hero">
        <div className="dhl-container">
          <div className="dhl-home-layout">
            <picture className="dhl-home-media" aria-hidden="true">
              <source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.webp} type="image/webp" />
              <source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.fallback} type="image/jpeg" />
              <source srcSet={brandConfig.cinematicPortrait.webp} type="image/webp" />
              <img src={brandConfig.cinematicPortrait.fallback} alt="" decoding="async" />
            </picture>
            <div className="dhl-home-shade" aria-hidden="true" />
            <div className="dhl-home-copy">
              <span className="dhl-home-greeting">Hello, <strong>Guest</strong></span>
              <span className="dhl-eyebrow">Express delivery, made clear</span>
              <h1>Track your <span>{brandConfig.appName}</span> shipment</h1>
              <p>Follow every milestone with live shipment updates and support when you need it.</p>
              <TrackingForm />
            </div>
          </div>
        </div>
      </section>
      <section className="dhl-actions dhl-container">
        <div className="dhl-actions-heading">
          <div><span className="dhl-section-kicker">Explore services</span><h2>Quick actions</h2></div>
          <p>Everything you need for your shipment.</p>
        </div>
        <div className="dhl-action-grid">
          {actions.map(({ title, description, icon: Icon, to, tone }) => (
            <Link className={`dhl-action dhl-card tone-${tone}`} key={title} to={to}>
              <span className="dhl-action-icon"><Icon size={21} strokeWidth={2} aria-hidden="true" /></span>
              <strong>{title}</strong>
              <small>{description}</small>
              <ChevronRight className="dhl-action-chevron" size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
