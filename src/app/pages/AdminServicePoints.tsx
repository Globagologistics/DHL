import { MapPin } from 'lucide-react';

export default function AdminServicePoints() {
  return <div><div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">NETWORK</span><h1>Service Points</h1><p>Manage verified DHL locations when a service-point source is connected.</p></div></div><section className="dhl-admin-card"><div className="dhl-admin-empty dhl-admin-service-empty"><MapPin size={29}/><strong>Service-point data is not connected</strong><span>The current application has no service-point table or management API. No locations have been invented for this screen.</span></div></section></div>;
}
