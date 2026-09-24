import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import ShipmentWizard from '../../features/shipment-form/ShipmentWizard';
import { deriveLifecycleState } from '../../features/shipments/lifecycle';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import { draftFromShipment, updateShipmentDetails } from '../../services/shipmentWorkflowService';

/** Editing is allowed until the shipment starts moving. */
export default function AdminEditShipment() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { shipment, loading } = useShipmentWithCheckpoints(id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const initial = useMemo(() => (shipment ? draftFromShipment(shipment) : null), [shipment?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const photos = useMemo(() => (shipment?.images || []).filter(Boolean).map(url => ({ id: url.slice(-40) + Math.random(), url })), [shipment?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading) return <div className="dhl-admin-empty"><Package size={25} /><strong>Loading shipment…</strong></div>;
  if (!shipment || !initial) return <div className="dhl-admin-empty"><Package size={25} /><strong>Shipment not found</strong><Link className="dhl-admin-button" to="/admin/shipments">Back to Shipments</Link></div>;
  const state = deriveLifecycleState(shipment);
  const editable = ['draft', 'scheduled', 'awaiting_takeoff'].includes(state);
  return <div className="dhl-admin-create">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">SHIPMENT OPERATIONS</span><h1>Edit Shipment</h1><p>{shipment.package_name || 'Shipment'} · changes apply before the shipment starts.</p></div><Link className="dhl-admin-button" to={`/admin/shipments/${shipment.id}`}>Back to Control Panel</Link></div>
    {editable
      ? <ShipmentWizard mode="admin" initial={initial} initialPhotos={photos} startStep={4} submitLabel="Save Changes" submitting={submitting} submitError={error}
          onSubmit={async (draft, next) => {
            setSubmitting(true); setError('');
            try { await updateShipmentDetails(shipment.id, draft, next); navigate(`/admin/shipments/${shipment.id}?saved=1`); }
            catch (cause) { setError(cause instanceof Error ? cause.message : 'Changes could not be saved.'); }
            finally { setSubmitting(false); }
          }} />
      : <div className="dhl-admin-card dhl-admin-empty"><Package size={24} /><strong>This shipment can no longer be edited</strong><span>Details are locked once a shipment has started. Use the control panel to post updates or change its status.</span></div>}
  </div>;
}
