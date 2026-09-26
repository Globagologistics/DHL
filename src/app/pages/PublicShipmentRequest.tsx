import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Home } from 'lucide-react';
import ShipmentWizard from '../../features/shipment-form/ShipmentWizard';
import { submitShipmentRequest } from '../../services/shipmentRequestService';

/**
 * Shareable public form (/shipment-request/new). Customers describe the
 * shipment. The customer supplies the same shipment-information fields as
 * the admin; submitting never creates a live shipment or grants lifecycle access.
 */
export default function PublicShipmentRequest() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return <div className="dhl-public-request"><div className="dhl-public-request-inner">
    <div className="dhl-public-request-head"><span className="dhl-eyebrow">DHL Express</span><h1>Request a shipment</h1><p>Tell us what you are sending. Our team reviews every request before it becomes an active shipment.</p></div>
    {submitted
      ? <div className="dhl-admin-card dhl-admin-success"><span><CheckCircle2 size={27} /></span><h2>Shipment Request Submitted</h2><p>Your shipment details have been sent for review. The shipment is not active yet; you will be contacted once it is approved.</p><div><Link className="dhl-admin-button primary" to="/home"><Home size={16} /> Return Home</Link></div></div>
      : <ShipmentWizard mode="public" draftKey="dhl-public-request-draft" submitLabel="Submit Request" submitting={submitting} submitError={error}
          onSubmit={async (draft, photos, meta) => {
            setSubmitting(true); setError('');
            try { await submitShipmentRequest(draft, photos); await meta.completed(); setSubmitted(true); window.scrollTo({ top: 0 }); }
            catch (cause) { setError(cause instanceof Error ? cause.message : 'Your request could not be submitted.'); }
            finally { setSubmitting(false); }
          }} />}
  </div></div>;
}
