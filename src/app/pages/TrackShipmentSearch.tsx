import { useSearchParams, Navigate } from 'react-router-dom';
import { PageHeading, TrackingForm } from '../components/customer/CustomerShell';

export default function TrackShipmentSearch() {
  const [params] = useSearchParams();
  const id = params.get('id');
  if (id?.trim()) return <Navigate to={`/track/${encodeURIComponent(id.trim())}`} replace/>;
  return <div className="dhl-container dhl-search-page"><PageHeading title="Track Shipment" backTo="/home"/><section className="dhl-search-panel dhl-card"><span className="dhl-eyebrow">Track & trace</span><h1>Track your shipment</h1><p>Enter your tracking number to see its latest status and route.</p><TrackingForm/></section></div>;
}
