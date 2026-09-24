import { Link } from 'react-router-dom';
import { PageHeading } from '../components/customer/CustomerShell';
export default function SignUp() {
  return <div className="dhl-narrow dhl-search-page"><PageHeading title="Registration closed" backTo="/home"/><section className="dhl-card" style={{ padding: 30, textAlign: 'center' }}><p className="dhl-muted" style={{ marginBottom: 22 }}>Shipment accounts are created and managed by the service team. Contact support if you need access.</p><Link className="dhl-primary-button" to="/signin">Go to Sign In</Link></section></div>;
}
