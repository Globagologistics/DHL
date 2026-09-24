import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy, Package } from 'lucide-react';
import { AdminContext, type Shipment } from '../contexts/AdminContext';
import ShipmentWizard, { type ShipmentDraft } from '../../features/shipment-form/ShipmentWizard';

export default function AdminCreateShipment() {
  const { addShipment } = useContext(AdminContext);
  const [submitting,setSubmitting] = useState(false);
  const [error,setError] = useState('');
  const [createdId,setCreatedId] = useState('');
  const publish = async (draft:ShipmentDraft) => {
    setSubmitting(true); setError('');
    const id = crypto.randomUUID();
    try {
      await addShipment({
        id,
        senderName:draft.senderName.trim(),senderPhone:draft.senderPhone.trim(),senderEmail:draft.senderEmail.trim(),pickupLocation:draft.pickupLocation.trim(),
        receiverName:draft.receiverName.trim(),receiverPhone:draft.receiverPhone.trim(),receiverEmail:draft.receiverEmail.trim(),deliveryAddress:draft.deliveryAddress.trim(),
        packageName:draft.packageName.trim(),transportation:draft.transportation,images:draft.images,imageFiles:draft.imageFiles,
        cost:Number(draft.cost)||0,currency:draft.currency,paymentStatus:draft.paymentStatus,paid:draft.paymentStatus==='paid',paymentResponsibility:draft.paymentResponsibility,
        vehicleType:draft.vehicleType.trim(),vehiclesCount:Number(draft.vehiclesCount)||undefined,driverName:draft.driverName.trim(),driverExperience:draft.driverExperience.trim(),countdownDuration:Number(draft.countdownDuration)||24,
        checkpoints:draft.checkpoints.map(value=>value.trim()).filter(Boolean).map(location=>({id:crypto.randomUUID(),location})) as Shipment['checkpoints'],
      },true);
      setCreatedId(id);
    } catch (cause) { setError(cause instanceof Error?cause.message:'Shipment could not be published.'); }
    finally { setSubmitting(false); }
  };
  return <div><div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">SHIPMENT OPERATIONS</span><h1>Create Shipment</h1><p>Publish a shipment through a guided five-step flow.</p></div><Link className="dhl-admin-button" to="/admin/shipments">Back to Shipments</Link></div>{createdId?<div className="dhl-admin-card dhl-admin-success"><span><CheckCircle2 size={27}/></span><h2>Shipment published</h2><p>The shipment is active and its tracking number is ready to share.</p><code>{createdId}</code><div><button type="button" className="dhl-admin-button" onClick={()=>void navigator.clipboard.writeText(createdId)}><Copy size={16}/> Copy tracking ID</button><Link className="dhl-admin-button primary" to={`/admin/shipments/${createdId}`}><Package size={16}/> View shipment</Link></div></div>:<ShipmentWizard mode="admin" onSubmit={publish} submitting={submitting} submitError={error}/>}</div>;
}
