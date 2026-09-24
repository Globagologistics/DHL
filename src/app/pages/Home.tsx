import { Link } from 'react-router-dom';
import { ChevronRight, Headphones, MapPin, Package, Search } from 'lucide-react';
import { TrackingForm } from '../components/customer/CustomerShell';
import { brandConfig } from '../../config/brand';

const actions = [
  { title: 'Track Shipment', description: 'Follow your shipment’s journey', icon: Search, to: '/track', featured: true },
  { title: 'Send Shipment', description: 'Shipment services', icon: Package, to: '/send-shipment' },
  { title: 'Customer Support', description: 'Get help with your delivery', icon: Headphones, to: '/chat' },
  { title: 'Service Points', description: 'Find a location near you', icon: MapPin, to: '/locations' },
];

export default function Home() {
  return <>
    <section className="dhl-home-hero"><div className="dhl-container dhl-home-layout"><div className="dhl-home-copy"><span>Hello, Guest</span><span className="dhl-eyebrow">Express delivery, made clear</span><h1>Track your {brandConfig.appName} shipment</h1><p>Follow every milestone with live shipment updates and support when you need it.</p><TrackingForm/></div><img className="dhl-home-image" src={brandConfig.campaignImage} alt="DHL campaign artwork with an aircraft, shipment box and delivery vans; text reads: Be aware of every little detail about your shipments"/></div></section>
    <section className="dhl-actions dhl-container"><h2>Quick Actions</h2><div className="dhl-action-grid">{actions.map(({ title, description, icon: Icon, to, featured }) => <Link className={`dhl-action dhl-card ${featured ? 'featured' : ''}`} key={title} to={to}><span className="dhl-action-icon"><Icon size={20}/></span><strong>{title}</strong><small>{description}</small><ChevronRight size={17} aria-hidden="true"/></Link>)}</div></section>
  </>;
}
