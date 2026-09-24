import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy, Package, Plus } from 'lucide-react';
import { AdminContext, type Shipment } from '../contexts/AdminContext';
import ShipmentWizard, { type ShipmentDraft } from '../../features/shipment-form/ShipmentWizard';
import { getTrackingNumber } from '../../services/shipmentService';
import { formatTrackingNumber } from '../../services/trackingService';

type Published = { id: string; trackingNumber: string | null };

export default function AdminCreateShipment() {
  const { addShipment } = useContext(AdminContext);
  const [submitting,setSubmitting] = useState(false);
  const [error,setError] = useState('');
  const [published,setPublished] = useState<Published|null>(null);
  const [copied,setCopied] = useState(false);
  const [formKey,setFormKey] = useState(0);
  const publish = async (draft:ShipmentDraft) => {
    setSubmitting(true); setError('');
    const id = crypto.randomUUID();
    try {
      await addShipment({
        id,
        senderName:draft.senderName.trim(),senderPhone:draft.senderPhone.trim(),senderEmail:draft.senderEmail.trim(),pickupLocation:draft.pickupLocation,
        receiverName:draft.receiverName.trim(),receiverPhone:draft.receiverPhone.trim(),receiverEmail:draft.receiverEmail.trim(),deliveryAddress:draft.deliveryAddress,
        packageName:draft.packageName.trim(),transportation:draft.transportation,images:draft.images,imageFiles:draft.imageFiles,
        cost:Number(draft.cost)||0,currency:draft.currency,paymentStatus:draft.paymentStatus,paid:draft.paymentStatus==='paid',paymentResponsibility:draft.paymentResponsibility,
        vehicleType:draft.vehicleType.trim(),vehiclesCount:Number(draft.vehiclesCount)||undefined,driverName:draft.driverName.trim(),driverExperience:draft.driverExperience.trim(),countdownDuration:Number(draft.countdownDuration)||24,
        checkpoints:draft.checkpoints.map(value=>value.trim()).filter(Boolean).map(location=>({id:crypto.randomUUID(),location})) as Shipment['checkpoints'],
        details:draft.details,
      },true);
      setPublished({ id, trackingNumber: await getTrackingNumber(id) });
    } catch (cause) { setError(cause instanceof Error?cause.message:'Shipment could not be published.'); }
    finally { setSubmitting(false); }
  };
  const reference = published?.trackingNumber || published?.id || '';
  const copy = () => { void navigator.clipboard?.writeText(reference).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }); };
  return <div><div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">SHIPMENT OPERATIONS</span><h1>Create Shipment</h1><p>Publish a shipment in five guided steps.</p></div><Link className="dhl-admin-button" to="/admin/shipments">Back to Shipments</Link></div>
    {published?<div className="dhl-admin-card dhl-admin-success"><span><CheckCircle2 size={27}/></span><h2>Shipment published</h2><p>The shipment is active and customers can track it with this number.</p><code className="dhl-admin-tracking-code">{published.trackingNumber?formatTrackingNumber(published.trackingNumber):published.id}</code>{!published.trackingNumber&&<p className="dhl-admin-muted-note">A 12-digit tracking number is assigned once the tracking-number migration is applied. Until then the shipment is tracked by its record ID.</p>}<div><button type="button" className="dhl-admin-button" onClick={copy}><Copy size={16}/> {copied?'Copied':'Copy tracking number'}</button><Link className="dhl-admin-button primary" to={`/admin/shipments/${published.id}`}><Package size={16}/> View shipment</Link><button type="button" className="dhl-admin-button" onClick={()=>{setPublished(null);setFormKey(value=>value+1);}}><Plus size={16}/> Create another</button></div></div>
      :<ShipmentWizard key={formKey} mode="admin" onSubmit={publish} submitting={submitting} submitError={error}/>}
  </div>;
}
