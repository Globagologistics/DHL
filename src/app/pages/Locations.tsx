import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { PageHeading } from '../components/customer/CustomerShell';

export default function Locations() {
  return <div className="dhl-narrow dhl-search-page"><PageHeading title="Service Points" backTo="/home"/><section className="dhl-card" style={{ padding: 30, textAlign: 'center' }}><MapPin size={40} color="var(--dhl-red)" style={{ margin: '0 auto 18px' }}/><h2 style={{ fontSize: 24, marginBottom: 12 }}>Location search is coming soon</h2><p className="dhl-muted" style={{ marginBottom: 22 }}>Verified service point data is not connected to this concept yet.</p><Link className="dhl-secondary-button" to="/home">Back to Home</Link></section></div>;
}
