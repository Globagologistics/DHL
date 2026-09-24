import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy } from 'lucide-react';
import ShipmentWizard, { type ShipmentDraft } from '../../features/shipment-form/ShipmentWizard';
import { submitShipmentRequest } from '../../services/shipmentRequestService';

export default function PublicShipmentRequest() {
  const [submitting,setSubmitting] = useState(false);
  const [error,setError] = useState('');
  const [reference,setReference] = useState('');
  const submit = async (draft:ShipmentDraft) => {
    setSubmitting(true); setError('');
    try { setReference(await submitShipmentRequest(draft)); }
    catch(cause) { setError(cause instanceof Error?cause.message:'Request could not be submitted.'); }
    finally { setSubmitting(false); }
  };
  return <div className="dhl-public-request"><div className="dhl-public-request-inner"><div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">DHL EXPRESS</span><h1>Request a shipment</h1><p>Tell us what you need to send. Our team will review the details before activation.</p></div><Link className="dhl-admin-button" to="/home">Back to Home</Link></div>{reference?<div className="dhl-admin-card dhl-admin-success"><span><CheckCircle2 size={27}/></span><h2>Shipment request submitted.</h2><p>Our team will review your shipment details before activation.</p><code>{reference}</code><div><button className="dhl-admin-button" type="button" onClick={()=>void navigator.clipboard.writeText(reference)}><Copy size={16}/> Copy reference</button><Link className="dhl-admin-button primary" to="/home">Return Home</Link></div></div>:<ShipmentWizard mode="public" onSubmit={submit} submitting={submitting} submitError={error}/>}</div></div>;
}
