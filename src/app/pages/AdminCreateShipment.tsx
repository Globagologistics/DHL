import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShipmentWizard from '../../features/shipment-form/ShipmentWizard';
import { CopyFormLinkButton } from '../../features/shipments/ShipmentBits';
import { confirmShipmentExists, createScheduledShipment } from '../../services/shipmentWorkflowService';

/** Guided creation. The result is a SCHEDULED shipment: not published, not moving. */
export default function AdminCreateShipment() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  return <div className="dhl-admin-create">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">SHIPMENT OPERATIONS</span><h1>Create Shipment</h1><p>Five short steps. Nothing moves until you publish and start it.</p></div><div className="dhl-admin-page-actions"><CopyFormLinkButton /><Link className="dhl-admin-button" to="/admin/shipments">Back to Shipments</Link></div></div>
    <ShipmentWizard
      mode="admin"
      draftKey="dhl-admin-shipment-draft"
      submitLabel="Create Shipment"
      submitting={submitting}
      submitError={error}
      onSubmit={async (draft, photos, meta) => {
        setSubmitting(true); setError('');
        try {
          // The shipment takes the draft id, so its images are already filed
          // under shipments/<shipment-id>/ and never need moving.
          const id = await createScheduledShipment(draft, photos, meta.draftId);
          // Confirm the row really exists before the draft is thrown away.
          await confirmShipmentExists(id);
          await meta.completed();
          navigate(`/admin/shipments/${id}?created=1`);
        }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'The shipment could not be created.'); }
        finally { setSubmitting(false); }
      }}
    />
  </div>;
}
