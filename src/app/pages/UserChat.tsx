import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ChevronRight, Headphones, Info, MapPin, Package, ShieldCheck, Truck, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ensureChatThread, markThreadRead, sendChatMessage, useChatMessages } from '../../hooks/useChat';
import { TrackingNumberInput } from '../../features/tracking/TrackingNumberInput';
import { useTrackingLookup } from '../../features/tracking/useTrackingLookup';
import { WhatsAppIcon, WhatsAppSupportButton } from '../../features/whatsapp/WhatsAppSupport';
import { displayTrackingReference, formatTrackingNumber, isShipmentRecordId, trackingReferenceFor } from '../../services/trackingService';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import { formatJourneyStatus, getShipmentJourneyState } from '../utils/shipmentJourney';
import { brandConfig } from '../../config/brand';
import { activeSupportAgent } from '../../config/supportAgents';
import { isDemoThreadId } from '../../demo/demoChatStore';
import { supabase } from '../../lib/supabase';
import type { ChatMessage } from '../../types/chat';
import type { ShipmentWithCheckpoints } from '../../types/database';
import { ChatComposer } from '../components/chat/ChatComposer';
import { ReplyableMessage } from '../components/chat/ReplyableMessage';

/** trackingId is the shipment record id used by chat; reference is what the customer typed. */
type ActiveThread = { id: string; trackingId: string; reference: string };
type ShipmentContext = { trackingId:string; trackingPath:string; status:string; estimatedDelivery:string; destination:string; latestUpdate:string; origin:string; packageLabel:string; routeScreenshot?:string };

const readableDate = (value?: string | null) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided';
const assetUrl = (value: string, bucket: string) => value.startsWith('http') || value.startsWith('data:') || value.startsWith('/') ? value : supabase.storage.from(bucket).getPublicUrl(value).data.publicUrl;

function shipmentContext(reference:string, shipment:ShipmentWithCheckpoints|null):ShipmentContext {
  const latest=[...(shipment?.checkpoints||[])].filter(point=>point.status!=='pending').sort((a,b)=>b.checkpoint_order-a.checkpoint_order)[0];
  const route=shipment?.route_screenshot_url;
  const trackingRef=shipment?trackingReferenceFor(shipment):reference;
  return { trackingId:shipment?displayTrackingReference(shipment):formatTrackingNumber(reference), trackingPath:`/track/${encodeURIComponent(trackingRef)}`, status:shipment?formatJourneyStatus(getShipmentJourneyState(shipment).status):'Shipment', estimatedDelivery:readableDate(shipment?.estimated_delivery_at), destination:shipment?.delivery_address||'Not available', latestUpdate:latest?`Latest checkpoint: ${latest.location}`:'No checkpoints recorded', origin:shipment?.pickup_location||'Origin not provided', packageLabel:shipment?.package_name||'Shipment', routeScreenshot:route?assetUrl(route,'route-screenshots'):undefined };
}

function ShipmentContextPanel({context}:{context:ShipmentContext}) { return <div className="dhl-chat-context-inner"><span className="dhl-eyebrow">Shipment context</span><h2>Delivery at a glance</h2><span className="dhl-chat-status-badge">{context.status}</span><dl><div><dt>TRACKING NUMBER</dt><dd>{context.trackingId}</dd></div><div><dt>ESTIMATED DELIVERY</dt><dd>{context.estimatedDelivery}</dd></div><div><dt>DESTINATION</dt><dd>{context.destination}</dd></div><div><dt>LATEST UPDATE</dt><dd>{context.latestUpdate}</dd></div></dl><div className="dhl-chat-route-preview"><span className="dhl-eyebrow">Shipment route</span>{context.routeScreenshot?<img src={context.routeScreenshot} alt="Recorded shipment route"/>:<div className="dhl-chat-route-stops"><span><MapPin size={17}/>{context.origin}</span><span><Truck size={17}/>{context.destination}</span></div>}</div><Link className="dhl-chat-full-tracking" to={context.trackingPath}>View Full Tracking <ChevronRight size={16}/></Link></div>; }

function ShipmentMessageCard({context,onDetails}:{context:ShipmentContext;onDetails:()=>void}) { return <article className="dhl-chat-shipment-card"><div className="dhl-chat-shipment-top"><span className="dhl-chat-shipment-icon"><Package size={19}/></span><div><small>TRACKING NUMBER</small><strong>{context.trackingId}</strong></div><span className="dhl-chat-status-badge">{context.status}</span></div><p>{context.packageLabel}</p><p className="dhl-chat-latest">{context.latestUpdate}</p><button className="dhl-chat-card-link" type="button" onClick={onDetails}>View Details <ChevronRight size={16}/></button></article>; }

/**
 * `developmentDemo` marks the local demo conversation (shipment 010101010101):
 * attachments are off and a small note explains it is shared with Admin Chat.
 */
function ChatView({context,messages,loading,developmentDemo,onBack,onSend}:{context:ShipmentContext;messages:ChatMessage[];loading:boolean;developmentDemo:boolean;onBack:()=>void;onSend:(text:string,file:File|null,replyTo:ChatMessage|null)=>Promise<string|null>}) {
  const [detailsOpen,setDetailsOpen]=useState(false); const [replyTo,setReplyTo]=useState<ChatMessage|null>(null); const [following,setFollowing]=useState(true); const [newCount,setNewCount]=useState(0); const bottom=useRef<HTMLDivElement>(null); const scroller=useRef<HTMLDivElement>(null); const agent=activeSupportAgent();
  useEffect(()=>{if(following)bottom.current?.scrollIntoView({block:'end'});else if(messages.length)setNewCount(count=>count+1);},[messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{if(!detailsOpen)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setDetailsOpen(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[detailsOpen]);
  const onScroll=()=>{const area=scroller.current;if(!area)return;const near=area.scrollHeight-area.scrollTop-area.clientHeight<88;setFollowing(near);if(near)setNewCount(0);}; const latest=()=>{setFollowing(true);setNewCount(0);bottom.current?.scrollIntoView({behavior:'smooth',block:'end'});};
  // The shipment card follows the opening exchange when there is one.
  const cardAfter=messages.length>=3?2:-1;
  const card=<ShipmentMessageCard context={context} onDetails={()=>setDetailsOpen(true)}/>;
  return <div className="dhl-chat-shell"><section className="dhl-conversation" aria-label="Shipment support conversation"><header className="dhl-chat-header"><button className="dhl-icon-button" type="button" onClick={onBack} aria-label="Back to customer support"><ArrowLeft size={21}/></button><img className="dhl-chat-header-agent" src={agent.avatar} alt=""/><div className="dhl-chat-header-title"><strong>{agent.name}</strong><span><i/> DHL Shipment Support · Online</span></div><button className="dhl-icon-button dhl-chat-info" type="button" onClick={()=>setDetailsOpen(true)} aria-label="Shipment details"><Info size={21}/></button></header><div className="dhl-chat-ref"><span className="dhl-chat-ref-icon"><Package size={18}/></span><span><small>TRACKING NUMBER</small><strong>{context.trackingId}</strong></span><span className="dhl-chat-status-badge">{context.status}</span></div>
    <div ref={scroller} onScroll={onScroll} className="dhl-chat-messages" role="log" aria-live="polite" aria-label="Conversation messages">
      {developmentDemo&&<p className="dhl-chat-preview-note">Development demo conversation · shared with Admin Chat in this browser</p>}
      {loading&&<p className="dhl-chat-empty">Loading messages…</p>}
      {!loading&&!messages.length&&<p className="dhl-chat-empty">Your conversation is ready. Send a message to shipment support.</p>}
      {cardAfter<0&&card}
      {messages.map((message,index)=><div key={message.id}><ReplyableMessage message={message} activeRole="user" onReply={setReplyTo}/>{index===cardAfter&&card}</div>)}
      <div ref={bottom}/>
    </div>
    {newCount>0&&<button type="button" className="dhl-chat-new-message" onClick={latest}>New message ↓</button>}
    <ChatComposer replyTo={replyTo} onCancelReply={()=>setReplyTo(null)} attachmentDisabled={developmentDemo} onSend={(text,file)=>onSend(text,file,replyTo)}/></section>
    <aside className="dhl-chat-context"><ShipmentContextPanel context={context}/></aside>
    {detailsOpen&&<div className="dhl-chat-details-layer" onMouseDown={event=>{if(event.target===event.currentTarget)setDetailsOpen(false);}}><section className="dhl-chat-details-dialog" role="dialog" aria-modal="true" aria-label="Shipment details"><button className="dhl-chat-details-close" type="button" onClick={()=>setDetailsOpen(false)} aria-label="Close shipment details"><X size={21}/></button><ShipmentContextPanel context={context}/></section></div>}</div>;
}

function Conversation({thread,onBack}:{thread:ActiveThread;onBack:()=>void}) {
  const {messages,loading}=useChatMessages(thread.trackingId,thread.id);
  const {shipment}=useShipmentWithCheckpoints(thread.trackingId);
  useEffect(()=>{void markThreadRead(thread.id,'user');},[thread.id,messages.length]);
  return <ChatView context={shipmentContext(thread.reference,shipment)} messages={messages} loading={loading} developmentDemo={isDemoThreadId(thread.id)} onBack={onBack} onSend={async(text,file,replyTo)=>{const result=await sendChatMessage({trackingId:thread.trackingId,threadId:thread.id,sender:'user',text,mediaFiles:file?[file]:[],replyToMessageId:replyTo?.id});return result.error||null;}}/>;
}

type GateIssue = 'chat_unavailable' | null;

/**
 * Customer Support entry. The 12-digit number is checked automatically once
 * complete (or on Continue); a found shipment then opens its conversation.
 */
export default function UserChat(){
  const [params]=useSearchParams();const navigate=useNavigate();const fieldId=useId();const input=useRef<HTMLInputElement>(null);
  const [thread,setThread]=useState<ActiveThread|null>(null);const [issue,setIssue]=useState<GateIssue>(null);const [opening,setOpening]=useState(false);const [charWarning,setCharWarning]=useState(false);
  const openTimer=useRef<number|null>(null);
  const openShipment=async(shipmentId:string,reference:string)=>{
    setOpening(true);setIssue(null);
    const active=await ensureChatThread(shipmentId);
    if(!active){setOpening(false);setIssue('chat_unavailable');return;}
    openTimer.current=window.setTimeout(()=>{setOpening(false);setThread({id:active.id,trackingId:active.trackingId,reference});},400);
  };
  const lookup=useTrackingLookup({onFound:(shipment,digits)=>{void openShipment(shipment.shipmentId,shipment.trackingNumber||digits);}});
  const {digits,phase,searchedNumber,start}=lookup;
  const initial=params.get('id')?.trim()||'';
  useEffect(()=>{if(!initial)return;if(isShipmentRecordId(initial)){void openShipment(initial,initial);return;}start(initial);},[initial]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>()=>{if(openTimer.current!==null)window.clearTimeout(openTimer.current);},[]);
  const back=()=>{setThread(null);setIssue(null);lookup.setDigits('');navigate('/chat',{replace:true});};
  if(thread)return <Conversation thread={thread} onBack={back}/>;
  const busy=phase==='searching'||opening||(phase==='found'&&!issue);
  const submit=(event:FormEvent)=>{event.preventDefault();setIssue(null);if(phase==='error'){lookup.retry();return;}if(phase==='found'&&issue==='chat_unavailable'){lookup.retry();return;}if(!lookup.submit())input.current?.focus();};
  const helperId=`${fieldId}-status`;
  const status=issue==='chat_unavailable'?<span className="dhl-support-signin">We found your shipment, but a support conversation needs you to sign in with the email linked to it. <Link to={`/signin?next=${encodeURIComponent(`/chat?id=${searchedNumber||digits}`)}`}>Sign in</Link></span>
    :charWarning?<span className="dhl-error-text">Tracking numbers can contain numbers only.</span>
    :phase==='searching'||opening?<><span className="dhl-support-spinner"/> {opening?'Opening your conversation…':'Checking shipment…'}</>
    :phase==='found'?<><ShieldCheck size={17}/> Shipment found</>
    :phase==='not_found'?<span className="dhl-error-text">We couldn’t find a shipment matching this tracking number. Check the 12 digits on your receipt.</span>
    :phase==='error'?<span className="dhl-error-text">We’re having trouble checking this shipment right now. This is a connection problem on our side, not a problem with your tracking number.</span>
    :phase==='incomplete'?<span className="dhl-error-text">Enter the complete 12-digit tracking number.</span>
    :phase==='typing'?<span className="dhl-support-neutral">Tracking numbers contain 12 digits.</span>
    :phase==='ready'?<span className="dhl-support-neutral">Checking automatically…</span>
    :null;
  return <section className="dhl-support-page"><picture className="dhl-support-background" aria-hidden="true"><source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.webp} type="image/webp"/><source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.fallback} type="image/jpeg"/><source srcSet={brandConfig.cinematicPortrait.webp} type="image/webp"/><img src={brandConfig.cinematicPortrait.fallback} alt=""/></picture><div className="dhl-support-wash" aria-hidden="true"/>
    <div className="dhl-support-gate"><div className="dhl-support-gate-icon"><Headphones size={30}/></div><span className="dhl-eyebrow">Customer support</span><h1>Connect to<br/>Shipment Support</h1><p>Enter your 12-digit tracking number to start a support conversation linked to your shipment.</p>
      <form onSubmit={submit} noValidate><label htmlFor={fieldId}>Tracking number</label><div className={`dhl-support-input-wrap${phase==='incomplete'||charWarning?' invalid':''}`}><Package size={19} aria-hidden="true"/><TrackingNumberInput id={fieldId} ref={input} value={digits} onRejectedInput={()=>setCharWarning(true)} onValueChange={value=>{if(value!==digits)setCharWarning(false);setIssue(null);lookup.setDigits(value);}} placeholder="0000 0000 0000" aria-describedby={helperId} aria-invalid={phase==='incomplete'||charWarning}/></div>
        <div id={helperId} className="dhl-support-verification" role="status" aria-live="polite">{status}</div>
        <button className="dhl-support-continue" type="submit" disabled={busy}>{phase==='error'?'Try Again':'Continue to Support'} <ChevronRight size={18}/></button>
        <WhatsAppSupportButton trackingId={digits.length===12?digits:null} className="dhl-whatsapp-action dhl-support-alt"><WhatsAppIcon size={18}/> Chat on WhatsApp instead</WhatsAppSupportButton>
      </form>
      <p className="dhl-support-helper"><ShieldCheck size={17}/> Access to a conversation is verified by the shipment support service.</p></div></section>;
}
