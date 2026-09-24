import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock3, Package, XCircle } from 'lucide-react';
import ShipmentWizard from '../../features/shipment-form/ShipmentWizard';
import { emptyShipmentDraft } from '../../features/shipments/types';
import type { ShipmentDraft } from '../../features/shipments/types';
import { approveShipmentRequest, listShipmentRequests, rejectShipmentRequest } from '../../services/shipmentRequestService';
import { storePackagePhotos } from '../../services/shipmentWorkflowService';
import { isDevRequestId } from '../../demo/devDataStore';
import type { ShipmentRequest } from '../../services/shipmentRequestService';

const draftFromRequest = (request: ShipmentRequest): ShipmentDraft => {
  const payload = request.payload;
  return {
    ...emptyShipmentDraft,
    senderName: payload.senderName || '', senderPhone: payload.senderPhone || '', pickupLocation: payload.pickupLocation || request.origin,
    receiverName: payload.receiverName || '', receiverPhone: payload.receiverPhone || '', receiverEmail: payload.receiverEmail || '', deliveryAddress: payload.deliveryAddress || request.destination,
    packageName: payload.packageName || '', packageValue: payload.packageValue || '', currency: payload.currency || 'USD',
    paymentStatus: payload.paymentStatus || 'unpaid', outstandingAmount: payload.outstandingAmount || '',
    images: (payload.images || []).filter(Boolean),
    estimatedDelivery: payload.estimatedDelivery || '',
    transportation: payload.transportation || 'Air Freight', carrierRole: payload.carrierRole || 'Pilot', carrierName: payload.carrierName || '',
    route: payload.route || {},
  };
};

/** Admin completes the operational details and approves. Approval creates a SCHEDULED shipment. */
export default function AdminRequestReview() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ShipmentRequest | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  useEffect(() => { void listShipmentRequests().then(list => setRequest(list.find(item => item.id === id) || null)).catch(() => setRequest(null)); }, [id]);
  const initial = useMemo(() => (request ? draftFromRequest(request) : null), [request?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const photos = useMemo(() => (initial?.images || []).map((url, index) => ({ id: `${index}-${url.slice(-24)}`, url })), [initial]);

  if (request === undefined) return <div className="dhl-admin-empty"><Clock3 size={25} /><strong>Loading request…</strong></div>;
  if (!request || !initial) return <div className="dhl-admin-empty"><Package size={25} /><strong>Request not found</strong><Link className="dhl-admin-button" to="/admin/requests">Back to Requests</Link></div>;

  const reject = async () => {
    setRejecting(true); setError('');
    try { await rejectShipmentRequest(request.id, reason); navigate('/admin/requests', { replace: true }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The request could not be rejected.'); setRejecting(false); }
  };

  return <div className="dhl-admin-create">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">REQUEST REVIEW · {request.id.slice(0, 8).toUpperCase()}</span><h1>{request.payload.packageName || 'Shipment request'}</h1><p>From {request.sender_name} to {request.recipient_name} · submitted {new Date(request.created_at).toLocaleString()}</p></div><Link className="dhl-admin-button" to="/admin/requests">Back to Requests</Link></div>
    {request.status !== 'pending'
      ? <div className="dhl-admin-card dhl-admin-empty"><Package size={24} /><strong>This request was {request.status}</strong>{request.rejection_reason && <span>Reason: {request.rejection_reason}</span>}{request.shipment_id && <Link className="dhl-admin-button primary" to={`/admin/shipments/${request.shipment_id}`}>Open Shipment Control</Link>}</div>
      : <>
        <p className="dhl-admin-banner" role="status">Check the customer’s details, then add the delivery estimate, payment status and carrier in step 4. Approving creates a scheduled shipment; you publish and start it separately.</p>
        <ShipmentWizard mode="admin" initial={initial} initialPhotos={photos} submitLabel="Approve & Create Shipment" submitting={submitting} submitError={error}
          reviewFooter={<div className="dhl-request-reject"><h3><XCircle size={16} /> Reject request</h3><textarea rows={2} value={reason} onChange={event => setReason(event.target.value)} placeholder="Reason for rejecting (kept with the request)" aria-label="Reason for rejecting" /><button type="button" className="dhl-admin-button danger" disabled={!reason.trim() || rejecting} onClick={() => void reject()}>{rejecting ? 'Rejecting…' : 'Reject Request'}</button></div>}
          onSubmit={async (draft, next) => {
            setSubmitting(true); setError('');
            try {
              // Photos added or replaced during review are uploaded before approval.
              const images = await storePackagePhotos(next, `requests/${request.id}`, isDevRequestId(request.id));
              const shipmentId = await approveShipmentRequest(request.id, { ...draft, images });
              navigate(`/admin/shipments/${shipmentId}?created=1`);
            } catch (cause) { setError(cause instanceof Error ? cause.message : 'Approval failed.'); }
            finally { setSubmitting(false); }
          }} />
      </>}
  </div>;
}
