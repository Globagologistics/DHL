import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BrandLogo } from '../components/customer/CustomerShell';
import { brandConfig } from '../../config/brand';

export default function Onboarding() {
  return <section className="dhl-welcome">
    <div className="dhl-welcome-copy"><BrandLogo/><div className="dhl-welcome-content"><span className="dhl-eyebrow">The world on time</span><h1>Delivering<br/>possibilities.<br/><em>Worldwide.</em></h1><p>Real-time shipment updates, delivery progress and secure customer support in one seamless experience.</p><Link to="/home" className="dhl-primary-button">Get Started <ChevronRight size={19}/></Link></div></div>
    <div className="dhl-welcome-photo"><img src={brandConfig.campaignImage} alt="DHL campaign artwork with an aircraft, shipment box and delivery vans; text reads: Be aware of every little detail about your shipments"/></div>
  </section>;
}
