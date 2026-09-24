import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Bell, Check, Mail, MessageCircle, RefreshCw, Search, Send, Truck, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminContext, type Shipment } from '../contexts/AdminContext';
import { formatTrackingNumber } from '../../services/trackingService';
import { getEmailConfigurationStatus, sendManualNotification } from '../../services/settings/integrationSettingsService';
import type { EmailConfigurationStatus } from '../../features/settings/types';

type Delivery = {id:string;tracking_id:string;recipient_email:string;recipient_type:string;notification_type:string;delivery_status:string;attempt_count:number;sent_at:string|null;error_summary:string|null;created_at:string};
type Tab = 'all'|'shipment'|'message'|'system';
type Template = 'update'|'delay'|'delivery'|'custom';
type Recipient = 'sender'|'receiver';

const maskEmail = (email:string) => {const [name,domain]=email.split('@');return domain?`${name.slice(0,2)}${name.length>2?'***':''}@${domain}`:'Unavailable';};
const category = (kind:string):Tab => kind.includes('chat')?'message':kind.includes('shipment')||kind.includes('delivered')||kind.includes('hold')||kind.includes('payment')||kind.includes('released')||kind.includes('delayed')||kind.includes('cancelled')?'shipment':'system';
const referenceOf = (shipment:Shipment) => shipment.trackingNumber ? formatTrackingNumber(shipment.trackingNumber) : shipment.id.slice(0,8).toUpperCase();

const templates:Record<Template,{label:string;subject:(s:Shipment)=>string;message:(s:Shipment)=>string}> = {
  update:{label:'Shipment update',subject:s=>`Update on your shipment ${referenceOf(s)}`,message:s=>`Hello,\n\nHere is an update on your shipment to ${s.deliveryAddress||'its destination'}. It is moving through our network and we will keep you informed of each milestone.\n\nThank you for shipping with DHL Express.`},
  delay:{label:'Delay notice',subject:s=>`Your shipment ${referenceOf(s)} is delayed`,message:()=>`Hello,\n\nYour shipment is taking longer than planned. We are working to move it forward and will share a new delivery estimate as soon as it is confirmed.\n\nWe apologise for the inconvenience.`},
  delivery:{label:'Delivery reminder',subject:s=>`Your shipment ${referenceOf(s)} is on its way`,message:s=>`Hello,\n\nYour shipment is scheduled for delivery to ${s.deliveryAddress||'the recipient address'}. Please make sure someone is available to receive it.\n\nThank you.`},
  custom:{label:'Custom message',subject:()=>'',message:()=>''},
};

function SendNotificationDialog({shipments,onClose,onSent}:{shipments:Shipment[];onClose:()=>void;onSent:(message:string)=>void}) {
  const [query,setQuery]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const [recipients,setRecipients]=useState<Recipient[]>(['receiver']);
  const [template,setTemplate]=useState<Template>('update');
  const [subject,setSubject]=useState('');
  const [message,setMessage]=useState('');
  const [status,setStatus]=useState<EmailConfigurationStatus|null>(null);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const selected=shipments.find(item=>item.id===selectedId)||null;
  useEffect(()=>{void getEmailConfigurationStatus().then(setStatus);},[]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[onClose]);
  useEffect(()=>{if(!selected||template==='custom')return;setSubject(templates[template].subject(selected));setMessage(templates[template].message(selected));},[selected,template]);
  const matches=useMemo(()=>{const needle=query.trim().toLowerCase().replace(/\s/g,'');return shipments.filter(item=>!needle||[item.trackingNumber,item.id,item.receiverName,item.senderName,item.deliveryAddress].join(' ').toLowerCase().replace(/\s/g,'').includes(needle)).slice(0,6);},[shipments,query]);
  const emailFor=(role:Recipient)=>selected?(role==='sender'?selected.senderEmail:selected.receiverEmail)||'':'';
  const toggle=(role:Recipient)=>setRecipients(current=>current.includes(role)?current.filter(item=>item!==role):[...current,role]);
  const ready=Boolean(selected&&recipients.some(role=>emailFor(role))&&subject.trim()&&message.trim());
  const canSend=Boolean(status?.testEmailAvailable);
  const send=async()=>{if(!selected||!ready)return;setSending(true);setError('');try{onSent(await sendManualNotification({shipmentId:selected.id,recipients:recipients.filter(role=>emailFor(role)),subject:subject.trim(),message:message.trim()}));}catch(cause){setError(cause instanceof Error?cause.message:'Notification could not be sent.');}finally{setSending(false);}};
  return <div className="dhl-admin-modal-layer" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section className="dhl-admin-compose dhl-admin-compose-wide" role="dialog" aria-modal="true" aria-labelledby="compose-title">
      <div className="dhl-admin-compose-head"><div><span className="dhl-admin-eyebrow">MANUAL NOTIFICATION</span><h2 id="compose-title">Send Notification</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={20}/></button></div>
      <div className="dhl-admin-compose-body">
        <div className="dhl-admin-compose-form">
          <div className="dhl-admin-compose-step"><strong><b>1</b> Shipment</strong>
            {selected?<div className="dhl-admin-compose-selected"><span><Truck size={17}/></span><div><strong>{referenceOf(selected)}</strong><small>{selected.receiverName||'Recipient'} · {selected.deliveryAddress||'Destination not set'}</small></div><button type="button" onClick={()=>setSelectedId('')}>Change</button></div>
              :<><div className="dhl-admin-list-search"><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search tracking number or customer" aria-label="Search shipments"/></div>
                <div className="dhl-admin-compose-results">{matches.length?matches.map(item=><button type="button" key={item.id} onClick={()=>setSelectedId(item.id)}><strong>{referenceOf(item)}</strong><small>{item.receiverName||'Recipient'} · {item.deliveryAddress||'—'}</small></button>):<p>No shipments match.</p>}</div></>}
          </div>
          <div className="dhl-admin-compose-step"><strong><b>2</b> Recipients</strong><div className="dhl-admin-compose-recipients">{(['sender','receiver'] as Recipient[]).map(role=><label key={role} className={!emailFor(role)&&selected?'disabled':''}><input type="checkbox" checked={recipients.includes(role)} onChange={()=>toggle(role)} disabled={Boolean(selected)&&!emailFor(role)}/><span><strong>{role==='sender'?'Sender':'Recipient'}</strong><small>{selected?(emailFor(role)?maskEmail(emailFor(role)):'No email on file'):'Select a shipment'}</small></span></label>)}</div></div>
          <div className="dhl-admin-compose-step"><strong><b>3</b> Message</strong>
            <div className="dhl-admin-segmented" role="radiogroup" aria-label="Template">{(Object.keys(templates) as Template[]).map(key=><button type="button" role="radio" aria-checked={template===key} key={key} className={template===key?'active':''} onClick={()=>{setTemplate(key);if(key==='custom'){setSubject('');setMessage('');}}}>{templates[key].label}</button>)}</div>
            <label className="dhl-admin-form-field"><span>Subject</span><input value={subject} maxLength={150} onChange={event=>setSubject(event.target.value)} placeholder="Subject line"/></label>
            <label className="dhl-admin-form-field"><span>Message</span><textarea value={message} maxLength={4000} rows={6} onChange={event=>setMessage(event.target.value)} placeholder="Write the message customers will receive"/></label>
          </div>
        </div>
        <aside className="dhl-admin-compose-preview" aria-label="Email preview"><span className="dhl-admin-eyebrow">PREVIEW</span><div className="dhl-admin-email-preview"><div className="dhl-admin-email-brand">DHL Express</div><div className="dhl-admin-email-body"><h3>{subject||'Subject line'}</h3>{(message||'Your message will appear here.').split(/\n{2,}/).map((part,index)=><p key={index}>{part}</p>)}{selected&&<><small>TRACKING NUMBER</small><strong>{referenceOf(selected)}</strong></>}<span className="dhl-admin-email-cta">Track shipment</span></div></div></aside>
      </div>
      {error&&<p className="dhl-admin-banner error" role="alert">{error}</p>}
      <div className="dhl-admin-compose-foot"><p className={canSend?'ok':''}>{status===null?'Checking email configuration…':canSend?<><Check size={15}/> Sends through the configured SMTP account.</>:'Available after email configuration. Automatic lifecycle emails are unaffected.'}</p><div><button type="button" className="dhl-admin-button" onClick={onClose}>Cancel</button><button type="button" className="dhl-admin-button primary" disabled={!ready||!canSend||sending} onClick={()=>void send()}><Send size={16}/>{sending?'Sending…':'Send Notification'}</button></div></div>
    </section>
  </div>;
}

export default function AdminNotifications() {
  const {shipments}=useContext(AdminContext);
  const [deliveries,setDeliveries]=useState<Delivery[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState('');
  const [tab,setTab]=useState<Tab>('all');
  const [composeOpen,setComposeOpen]=useState(false);
  const shipmentById=useMemo(()=>new Map(shipments.map(item=>[item.id,item])),[shipments]);
  const load=useCallback(async()=>{setLoading(true);const {data,error}=await supabase.from('notification_deliveries').select('id,tracking_id,recipient_email,recipient_type,notification_type,delivery_status,attempt_count,sent_at,error_summary,created_at').order('created_at',{ascending:false}).limit(100);if(error)setMessage('Unable to load notification delivery records.');else{setDeliveries((data||[]) as Delivery[]);setMessage('');}setLoading(false);},[]);
  useEffect(()=>{void load();},[load]);
  const retry=async(id:string)=>{const {data,error}=await supabase.rpc('retry_notification_delivery',{p_delivery_id:id});if(error||!data)setMessage('This delivery could not be queued for retry.');else{setMessage('Retry queued. The scheduled notification worker will perform the send.');void load();}};
  const visible=useMemo(()=>deliveries.filter(delivery=>tab==='all'||category(delivery.notification_type)===tab),[deliveries,tab]);
  const counts=useMemo(()=>({all:deliveries.length,shipment:deliveries.filter(item=>category(item.notification_type)==='shipment').length,message:deliveries.filter(item=>category(item.notification_type)==='message').length,system:deliveries.filter(item=>category(item.notification_type)==='system').length}),[deliveries]);
  const reference=(delivery:Delivery)=>{const shipment=shipmentById.get(delivery.tracking_id);return shipment?referenceOf(shipment):delivery.tracking_id.slice(0,8).toUpperCase();};
  return <div className="dhl-admin-notifications"><div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">COMMUNICATIONS</span><h1>Notification Center</h1><p>Monitor customer updates and delivery attempts.</p></div><div className="dhl-admin-page-actions"><button type="button" className="dhl-admin-button" onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button><button type="button" className="dhl-admin-button primary" onClick={()=>setComposeOpen(true)}><Send size={16}/> Send Notification</button></div></div>{message&&<p className="dhl-admin-banner" role="status">{message}</p>}
    <section className="dhl-admin-card"><div className="dhl-admin-tabs shipment-tabs" role="tablist" aria-label="Notification category">{([['all','All'],['shipment','Shipment Updates'],['message','Customer Messages'],['system','System']] as [Tab,string][]).map(([value,label])=><button key={value} type="button" role="tab" aria-selected={tab===value} className={tab===value?'active':''} onClick={()=>setTab(value)}>{label} <small>{counts[value]}</small></button>)}</div>
      {loading?<div className="dhl-admin-empty"><Bell size={23}/><strong>Loading deliveries...</strong></div>:visible.length?<div className="dhl-admin-notification-list">{visible.map(delivery=>{const kind=category(delivery.notification_type);const Icon=kind==='message'?MessageCircle:kind==='shipment'?Truck:Mail;return <article key={delivery.id}><span className={`dhl-admin-notification-icon ${kind}`}><Icon size={18}/></span><div><strong>{delivery.notification_type.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase())}</strong><p>{delivery.recipient_type} · {maskEmail(delivery.recipient_email)} · {reference(delivery)}</p>{delivery.error_summary&&<small className="error">{delivery.error_summary}</small>}</div><div className="dhl-admin-notification-tail"><span className={`dhl-admin-status ${delivery.delivery_status==='sent'?'delivered':delivery.delivery_status==='failed'?'alert':'pending'}`}>{delivery.delivery_status}</span><time>{new Date(delivery.sent_at||delivery.created_at).toLocaleString()}</time>{delivery.delivery_status==='failed'&&<button type="button" onClick={()=>void retry(delivery.id)}>Retry delivery</button>}</div></article>;})}</div>:<div className="dhl-admin-empty"><Bell size={24}/><strong>No notifications in this category</strong><span>Delivery activity will appear when events are queued.</span></div>}
    </section>
    {composeOpen&&<SendNotificationDialog shipments={shipments} onClose={()=>setComposeOpen(false)} onSent={text=>{setComposeOpen(false);setMessage(text);}}/>}
  </div>;
}
