import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { BellRing, Box, Check, ChevronLeft, ChevronRight, FileText, ImagePlus, Package, Plane, Ship, Truck, Warehouse } from 'lucide-react';
import type { ShipmentDetails, StructuredAddress } from '../../types/database';

export type ShipmentType = NonNullable<ShipmentDetails['shipmentType']>;

/**
 * Wizard draft. The structured address parts are composed into the existing
 * single-line pickupLocation / deliveryAddress columns on submit, and the
 * remaining structured fields travel in `details` (shipments.shipment_details).
 */
export type ShipmentDraft = {
  senderName:string; senderCompany:string; senderPhone:string; senderEmail:string;
  senderAddress:string; senderCity:string; senderState:string; senderPostalCode:string; senderCountry:string;
  receiverName:string; receiverCompany:string; receiverPhone:string; receiverEmail:string;
  receiverAddress:string; receiverCity:string; receiverState:string; receiverPostalCode:string; receiverCountry:string;
  shipmentType:ShipmentType; pieces:string; weightKg:string; lengthCm:string; widthCm:string; heightCm:string; packageName:string; reference:string;
  images:string[]; imageFiles:File[];
  transportation:string; vehicleType:string; vehiclesCount:string; driverName:string; driverExperience:string; countdownDuration:string;
  cost:string; currency:string; paymentStatus:'unpaid'|'pending'|'paid'; paymentResponsibility:'sender'|'receiver'|'company'; checkpoints:string[];
  /** Composed on submit from the structured address fields. */
  pickupLocation:string; deliveryAddress:string;
  /** Built on submit from the structured fields. */
  details?:ShipmentDetails;
};

export const initialShipmentDraft:ShipmentDraft = {
  senderName:'',senderCompany:'',senderPhone:'',senderEmail:'',senderAddress:'',senderCity:'',senderState:'',senderPostalCode:'',senderCountry:'',
  receiverName:'',receiverCompany:'',receiverPhone:'',receiverEmail:'',receiverAddress:'',receiverCity:'',receiverState:'',receiverPostalCode:'',receiverCountry:'',
  shipmentType:'parcel',pieces:'1',weightKg:'',lengthCm:'',widthCm:'',heightCm:'',packageName:'',reference:'',
  images:['','',''],imageFiles:[],
  transportation:'Air Freight',vehicleType:'',vehiclesCount:'',driverName:'',driverExperience:'',countdownDuration:'24',
  cost:'',currency:'USD',paymentStatus:'unpaid',paymentResponsibility:'sender',checkpoints:['','','','',''],
  pickupLocation:'',deliveryAddress:'',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const countries = ['United States','Canada','Mexico','United Kingdom','Ireland','Germany','France','Netherlands','Belgium','Spain','Italy','Switzerland','Sweden','Norway','Denmark','Poland','United Arab Emirates','Saudi Arabia','Qatar','India','China','Hong Kong','Singapore','Japan','South Korea','Australia','New Zealand','South Africa','Nigeria','Ghana','Kenya','Egypt','Brazil','Argentina'];
const shipmentTypes:{value:ShipmentType;label:string;description:string;icon:typeof Package}[] = [
  {value:'document',label:'Document',description:'Letters, contracts, papers',icon:FileText},
  {value:'parcel',label:'Parcel',description:'Boxed goods and packages',icon:Package},
  {value:'freight',label:'Freight',description:'Palletised or heavy cargo',icon:Warehouse},
  {value:'other',label:'Other',description:'Anything else',icon:Box},
];
const transports = [{value:'Air Freight',label:'Air Freight',icon:Plane},{value:'Ocean Cargo',label:'Ocean Cargo',icon:Ship},{value:'Land Transport',label:'Land Transport',icon:Truck},{value:'Door-to-Door Delivery',label:'Door-to-Door',icon:Package}];

type Party = 'sender'|'receiver';
const partyKeys = (party:Party) => ({
  name:`${party}Name`, company:`${party}Company`, phone:`${party}Phone`, email:`${party}Email`, address:`${party}Address`,
  city:`${party}City`, state:`${party}State`, postal:`${party}PostalCode`, country:`${party}Country`,
} as const);

const structuredAddress = (draft:ShipmentDraft, party:Party):StructuredAddress => {
  const keys = partyKeys(party);
  return { company:draft[keys.company].trim()||undefined, address:draft[keys.address].trim(), city:draft[keys.city].trim(), state:draft[keys.state].trim()||undefined, postalCode:draft[keys.postal].trim()||undefined, country:draft[keys.country].trim() };
};

/** "Company, Street, City, State Postal, Country" for the existing single-line columns. */
export function composeAddress(parts:StructuredAddress):string {
  const region = [parts.state, parts.postalCode].filter(Boolean).join(' ');
  return [parts.company, parts.address, parts.city, region, parts.country].map(value => value?.trim()).filter(Boolean).join(', ');
}

const positiveNumber = (value:string) => { const parsed = Number(value); return value.trim() !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined; };

/** Fills pickupLocation, deliveryAddress and details from the structured fields. */
export function finalizeDraft(draft:ShipmentDraft):ShipmentDraft {
  const sender = structuredAddress(draft,'sender');
  const recipient = structuredAddress(draft,'receiver');
  const details:ShipmentDetails = {
    shipmentType:draft.shipmentType,
    pieces:positiveNumber(draft.pieces),
    weightKg:positiveNumber(draft.weightKg),
    dimensionsCm:(draft.lengthCm||draft.widthCm||draft.heightCm)?{length:positiveNumber(draft.lengthCm),width:positiveNumber(draft.widthCm),height:positiveNumber(draft.heightCm)}:undefined,
    reference:draft.reference.trim()||undefined,
    sender, recipient,
  };
  return { ...draft, pickupLocation:composeAddress(sender), deliveryAddress:composeAddress(recipient), details };
}

export function describeShipment(details?:ShipmentDetails|null):string {
  if (!details) return '';
  const type = shipmentTypes.find(item => item.value === details.shipmentType)?.label;
  const size = details.dimensionsCm && [details.dimensionsCm.length, details.dimensionsCm.width, details.dimensionsCm.height].every(Boolean) ? `${details.dimensionsCm.length}×${details.dimensionsCm.width}×${details.dimensionsCm.height} cm` : '';
  return [type, details.pieces ? `${details.pieces} piece${details.pieces === 1 ? '' : 's'}` : '', details.weightKg ? `${details.weightKg} kg` : '', size].filter(Boolean).join(' · ');
}

type Props = { mode:'admin'|'public'; onSubmit:(draft:ShipmentDraft)=>Promise<void>; submitting:boolean; submitError:string };

export default function ShipmentWizard({mode,onSubmit,submitting,submitError}:Props) {
  const isAdmin = mode === 'admin';
  const steps = ['Sender','Recipient','Shipment','Services & Tracking',isAdmin?'Review & Publish':'Review & Submit'];
  const intros = ['Who is sending this shipment?','Where is it going and who will receive it?','What is being shipped?',isAdmin?'Choose the service, route milestones and payment details.':'Choose how you would like it shipped.','Check every detail before the final action.'];
  const [step,setStep] = useState(0);
  const [draft,setDraft] = useState<ShipmentDraft>(initialShipmentDraft);
  const [error,setError] = useState('');
  const [imagePreview,setImagePreview] = useState<string[]>([]);
  useEffect(() => () => imagePreview.forEach(url => URL.revokeObjectURL(url)), [imagePreview]);
  const set = <K extends keyof ShipmentDraft>(key:K,value:ShipmentDraft[K]) => { setDraft(current=>({...current,[key]:value})); setError(''); };
  const imageUrls = useMemo(()=>draft.images.map(value=>value.trim()).filter(Boolean),[draft.images]);

  const validParty = (party:Party, label:string) => {
    const keys = partyKeys(party);
    const required:[keyof ShipmentDraft,string][] = [[keys.name,'full name'],[keys.phone,'phone'],[keys.email,'email'],[keys.address,'address'],[keys.city,'city'],[keys.country,'country']];
    for (const [key,name] of required) if (!String(draft[key]||'').trim()) return `${label} ${name} is required.`;
    if (!EMAIL_PATTERN.test(draft[keys.email].trim())) return `Enter a valid ${label.toLowerCase()} email address.`;
    if (!/^[+\d][\d\s().-]{5,}$/.test(draft[keys.phone].trim())) return `Enter a valid ${label.toLowerCase()} phone number.`;
    return '';
  };
  const validStep = (index:number) => {
    if (index===0) return validParty('sender','Sender');
    if (index===1) return validParty('receiver','Recipient');
    if (index===2) {
      if (!draft.packageName.trim()) return 'Describe the contents of the shipment.';
      if (!Number.isInteger(Number(draft.pieces)) || Number(draft.pieces) < 1) return 'Pieces must be a whole number of at least 1.';
      if (!positiveNumber(draft.weightKg)) return 'Enter the total weight in kilograms.';
      if ([draft.lengthCm,draft.widthCm,draft.heightCm].some(value => value.trim() && !positiveNumber(value))) return 'Dimensions must be positive numbers.';
      if (isAdmin && imageUrls.length+draft.imageFiles.length<3) return 'Add at least 3 package images or image links.';
      if (imageUrls.length+draft.imageFiles.length>6) return 'Use no more than 6 package images.';
      if (imageUrls.some(url=>!/^https?:\/\//i.test(url))) return 'Image links must start with http or https.';
    }
    if (index===3 && isAdmin) {
      if (!draft.vehicleType.trim()) return 'Vehicle or aircraft type is required.';
      if (!positiveNumber(draft.countdownDuration)) return 'Estimated hours to arrival must be greater than 0.';
      if (draft.cost.trim() && !(Number(draft.cost) >= 0)) return 'Shipping cost must be 0 or more.';
      if (draft.checkpoints.filter(value=>value.trim()).length<5) return 'Add at least 5 route milestones.';
    }
    return '';
  };
  const goTo = (index:number) => { setStep(index); setError(''); window.scrollTo({top:0,behavior:'smooth'}); };
  const next = () => { const issue=validStep(step); if(issue){setError(issue);return;} goTo(Math.min(step+1,4)); };
  const finish = async (event:FormEvent) => {
    event.preventDefault();
    if (step < 4) { next(); return; }
    for(let index=0;index<4;index++){const issue=validStep(index);if(issue){setStep(index);setError(issue);return;}}
    await onSubmit(finalizeDraft({...draft,images:imageUrls}));
  };

  const field = (label:string,key:keyof ShipmentDraft,options?:{type?:string;placeholder?:string;required?:boolean;optional?:boolean;wide?:boolean;list?:string;autoComplete?:string;inputMode?:'numeric'|'decimal'|'tel'|'email'}) => <label className={`dhl-admin-form-field${options?.wide?' wide':''}`}><span>{label}{options?.required&&<i> *</i>}{options?.optional&&<em> optional</em>}</span><input type={options?.type||'text'} value={String(draft[key]??'')} onChange={event=>set(key,event.target.value as ShipmentDraft[typeof key])} placeholder={options?.placeholder||''} autoComplete={options?.autoComplete||'off'} list={options?.list} inputMode={options?.inputMode} /></label>;
  const partyFields = (party:Party, placeholderName:string) => {
    const keys = partyKeys(party);
    return <div className="dhl-admin-form-grid">
      {field('Full name',keys.name,{required:true,placeholder:placeholderName,autoComplete:'name'})}
      {field('Company',keys.company,{optional:true,placeholder:'Company name',autoComplete:'organization'})}
      {field('Phone',keys.phone,{required:true,type:'tel',inputMode:'tel',placeholder:'+1 555 000 0000',autoComplete:'tel'})}
      {field('Email',keys.email,{required:true,type:'email',inputMode:'email',placeholder:'name@example.com',autoComplete:'email'})}
      {field(party==='sender'?'Address':'Delivery address',keys.address,{required:true,wide:true,placeholder:'Street and number, building, unit',autoComplete:'street-address'})}
      {field('City',keys.city,{required:true,placeholder:'City',autoComplete:'address-level2'})}
      {field('State / Province',keys.state,{placeholder:'State or province',autoComplete:'address-level1'})}
      {field('Postal code',keys.postal,{placeholder:'Postal / ZIP code',autoComplete:'postal-code'})}
      {field('Country',keys.country,{required:true,placeholder:'Country',list:'dhl-wizard-countries',autoComplete:'country-name'})}
    </div>;
  };
  const previews = [...imageUrls.map(url=>({key:url,url,label:'Image link'})),...draft.imageFiles.map((file,index)=>({key:`file-${index}`,url:imagePreview[index],label:file.name}))];
  const finalized = step===4 ? finalizeDraft({...draft,images:imageUrls}) : null;
  const reviewCard = (title:string,index:number,body:ReactNode) => <section><div><h3>{title}</h3><button type="button" onClick={()=>goTo(index)}>Edit</button></div><p>{body}</p></section>;

  return <div className="dhl-admin-wizard">
    <datalist id="dhl-wizard-countries">{countries.map(country=><option key={country} value={country}/>)}</datalist>
    <ol className="dhl-admin-wizard-stepper" aria-label="Shipment form progress">{steps.map((label,index)=><li key={label}><button type="button" onClick={()=>{if(index<step)goTo(index);}} className={index===step?'active':index<step?'done':''} aria-current={index===step?'step':undefined} disabled={index>step}><span>{index<step?<Check size={14}/>:index+1}</span><strong>{label}</strong></button></li>)}</ol>
    <form onSubmit={finish} noValidate><div className="dhl-admin-wizard-panel">
      <div className="dhl-admin-wizard-heading"><span>STEP {step+1} OF 5</span><h2>{steps[step]}</h2><p>{intros[step]}</p></div>
      {error&&<p className="dhl-admin-banner error" role="alert">{error}</p>}{submitError&&<p className="dhl-admin-banner error" role="alert">{submitError}</p>}

      {step===0&&partyFields('sender','Sender full name')}
      {step===1&&partyFields('receiver','Recipient full name')}

      {step===2&&<>
        <h3>Shipment type</h3>
        <div className="dhl-admin-choice-grid dhl-admin-type-grid" role="radiogroup" aria-label="Shipment type">{shipmentTypes.map(({value,label,description,icon:Icon})=><button type="button" role="radio" aria-checked={draft.shipmentType===value} key={value} className={draft.shipmentType===value?'selected':''} onClick={()=>set('shipmentType',value)}><Icon size={20}/><strong>{label}</strong><small>{description}</small></button>)}</div>
        <div className="dhl-admin-form-grid">
          {field('Pieces','pieces',{required:true,type:'number',inputMode:'numeric',placeholder:'1'})}
          {field('Total weight (kg)','weightKg',{required:true,type:'number',inputMode:'decimal',placeholder:'0.0'})}
          <div className="dhl-admin-form-field wide"><span>Dimensions (cm) <em>optional</em></span><div className="dhl-admin-dimension-fields"><input aria-label="Length in centimetres" type="number" inputMode="decimal" placeholder="Length" value={draft.lengthCm} onChange={event=>set('lengthCm',event.target.value)}/><b aria-hidden="true">×</b><input aria-label="Width in centimetres" type="number" inputMode="decimal" placeholder="Width" value={draft.widthCm} onChange={event=>set('widthCm',event.target.value)}/><b aria-hidden="true">×</b><input aria-label="Height in centimetres" type="number" inputMode="decimal" placeholder="Height" value={draft.heightCm} onChange={event=>set('heightCm',event.target.value)}/></div></div>
          {field('Description of contents','packageName',{required:true,wide:true,placeholder:'e.g. Documents, electronics, medical supplies'})}
          {field('Reference','reference',{optional:true,placeholder:'Order or invoice number'})}
        </div>
        <div className="dhl-admin-form-divider"/>
        <h3>Package images <small>{isAdmin?'At least 3, up to 6.':'Optional image links to help our team review the request.'}</small></h3>
        {isAdmin&&<label className="dhl-admin-upload"><ImagePlus size={25}/><strong>Upload package images</strong><small>Select up to 6 images from your device</small><input type="file" accept="image/*" multiple onChange={event=>{const files=Array.from(event.target.files||[]).filter(file=>file.type.startsWith('image/')).slice(0,Math.max(0,6-imageUrls.length)); setImagePreview(files.map(file=>URL.createObjectURL(file))); set('imageFiles',files);}} /></label>}
        <div className="dhl-admin-form-grid">{draft.images.map((url,index)=><label className="dhl-admin-form-field" key={index}><span>Image URL {index+1}</span><input type="url" inputMode="url" placeholder="https://..." value={url} onChange={event=>set('images',draft.images.map((item,i)=>i===index?event.target.value:item))} /></label>)}</div>
        {draft.images.length+draft.imageFiles.length<6&&<button className="dhl-admin-text-action" type="button" onClick={()=>set('images',[...draft.images,''])}>+ Add another image URL</button>}
        {previews.length>0&&<div className="dhl-admin-image-previews">{previews.map(item=><div key={item.key}><img src={item.url} alt={item.label} onError={event=>{event.currentTarget.style.display='none';}}/><span>{item.label}</span></div>)}</div>}
      </>}

      {step===3&&<>
        <h3>Service type</h3>
        <div className="dhl-admin-choice-grid">{transports.map(({value,label,icon:Icon})=><button type="button" key={value} className={draft.transportation===value?'selected':''} aria-pressed={draft.transportation===value} onClick={()=>set('transportation',value)}><Icon size={20}/><strong>{label}</strong></button>)}</div>
        {isAdmin?<>
          <div className="dhl-admin-form-grid">
            {field('Vehicle / aircraft / vessel type','vehicleType',{required:true,placeholder:'e.g. Cargo van, aircraft'})}
            {field('Number of vehicles','vehiclesCount',{type:'number',inputMode:'numeric',placeholder:'1'})}
            {field('Driver / pilot name','driverName',{optional:true})}
            {field('Driver experience','driverExperience',{optional:true})}
            {field('Estimated hours to arrival','countdownDuration',{required:true,type:'number',inputMode:'numeric',placeholder:'24'})}
            {field('Shipping cost','cost',{type:'number',inputMode:'decimal',placeholder:'0.00'})}
            <label className="dhl-admin-form-field"><span>Currency</span><select value={draft.currency} onChange={event=>set('currency',event.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>NGN</option></select></label>
            <label className="dhl-admin-form-field"><span>Payment responsibility</span><select value={draft.paymentResponsibility} onChange={event=>set('paymentResponsibility',event.target.value as ShipmentDraft['paymentResponsibility'])}><option value="sender">Sender</option><option value="receiver">Receiver</option><option value="company">Company</option></select></label>
            <label className="dhl-admin-form-field"><span>Payment status</span><select value={draft.paymentStatus} onChange={event=>set('paymentStatus',event.target.value as ShipmentDraft['paymentStatus'])}><option value="unpaid">Unpaid</option><option value="pending">Awaiting payment</option><option value="paid">Paid</option></select></label>
          </div>
          <div className="dhl-admin-form-divider"/>
          <h3>Tracking checkpoints <small>Route milestones customers see on the timeline. At least 5, up to 12.</small></h3>
          <div className="dhl-admin-form-grid">{draft.checkpoints.map((location,index)=><label className="dhl-admin-form-field" key={index}><span>Milestone {index+1}</span><input value={location} onChange={event=>set('checkpoints',draft.checkpoints.map((item,i)=>i===index?event.target.value:item))} placeholder="City or facility" /></label>)}</div>
          {draft.checkpoints.length<12&&<button className="dhl-admin-text-action" type="button" onClick={()=>set('checkpoints',[...draft.checkpoints,''])}>+ Add milestone</button>}
        </>:<div className="dhl-admin-form-grid">
          <label className="dhl-admin-form-field"><span>Who pays for shipping?</span><select value={draft.paymentResponsibility} onChange={event=>set('paymentResponsibility',event.target.value as ShipmentDraft['paymentResponsibility'])}><option value="sender">Sender</option><option value="receiver">Recipient</option></select></label>
        </div>}
        <div className="dhl-admin-info-row"><BellRing size={18}/><span><strong>Customer notifications</strong>{isAdmin?'Sender and recipient receive email updates automatically once the shipment is published, using the notification settings.':'You will receive email updates at the addresses provided once our team approves the request.'}</span></div>
        {!isAdmin&&<div className="dhl-admin-info-row"><Truck size={18}/><span><strong>Routing and pricing</strong>Our team confirms the vehicle, route checkpoints and price during review.</span></div>}
      </>}

      {step===4&&finalized&&<div className="dhl-admin-review">
        {reviewCard('Sender',0,<>{draft.senderName}{draft.senderCompany&&<> · {draft.senderCompany}</>}<br/>{draft.senderEmail} · {draft.senderPhone}<br/>{finalized.pickupLocation}</>)}
        {reviewCard('Recipient',1,<>{draft.receiverName}{draft.receiverCompany&&<> · {draft.receiverCompany}</>}<br/>{draft.receiverEmail} · {draft.receiverPhone}<br/>{finalized.deliveryAddress}</>)}
        {reviewCard('Shipment',2,<>{describeShipment(finalized.details)}<br/>{draft.packageName}{draft.reference&&<><br/>Reference {draft.reference}</>}<br/>{imageUrls.length+draft.imageFiles.length} package image{imageUrls.length+draft.imageFiles.length===1?'':'s'}</>)}
        {reviewCard('Services & tracking',3,isAdmin?<>{draft.transportation} · {draft.vehicleType}<br/>{draft.checkpoints.filter(Boolean).length} milestones · {draft.countdownDuration} hours ETA<br/>{draft.currency} {draft.cost||'0'} · {draft.paymentStatus} · paid by {draft.paymentResponsibility}</>:<>{draft.transportation}<br/>Paid by {draft.paymentResponsibility==='receiver'?'recipient':'sender'}</>)}
        <div className="dhl-admin-review-note"><FileText size={18}/><span>{isAdmin?'Publishing creates an active shipment, assigns its 12-digit tracking number and notifies the sender and recipient.':'Submitting creates a pending request. No shipment becomes active until our team approves it.'}</span></div>
      </div>}

      <div className="dhl-admin-wizard-footer"><button type="button" className="dhl-admin-button" onClick={()=>goTo(Math.max(0,step-1))} disabled={step===0}><ChevronLeft size={16}/> Back</button>{step<4?<button type="submit" className="dhl-admin-button primary">Continue <ChevronRight size={16}/></button>:<button type="submit" className="dhl-admin-button primary" disabled={submitting}>{submitting?(isAdmin?'Publishing…':'Submitting…'):isAdmin?'Publish Shipment':'Submit Request'} <ChevronRight size={16}/></button>}</div>
    </div></form>
  </div>;
}
