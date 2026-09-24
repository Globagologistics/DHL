import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BrandLogo } from '../components/customer/CustomerShell';

const heroImage = 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1500&q=80';

export default function Onboarding() {
  return <section className="dhl-welcome">
    <div className="dhl-welcome-copy"><BrandLogo/><div className="dhl-welcome-content"><span className="dhl-eyebrow">The world on time</span><h1>Delivering<br/>possibilities.<br/><em>Worldwide.</em></h1><p>Real-time shipment updates, delivery progress and secure customer support in one seamless experience.</p><Link to="/home" className="dhl-primary-button">Get Started <ChevronRight size={19}/></Link></div></div>
    <div className="dhl-welcome-photo"><img src={heroImage} alt="Cargo aircraft at a logistics hub"/><span className="dhl-welcome-photo-caption">EXPRESS LOGISTICS · CONNECTED WORLDWIDE</span></div>
  </section>;
}
