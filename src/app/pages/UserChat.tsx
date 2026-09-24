import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Headphones, Paperclip, Send, ShieldCheck, Truck } from 'lucide-react';
import { BrandLogo, PageHeading, StatusBadge } from '../components/customer/CustomerShell';
import { ensureChatThread, markThreadRead, sendChatMessage, useChatMessages } from '../../hooks/useChat';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { formatJourneyStatus, getShipmentJourneyState } from '../utils/shipmentJourney';
import { brandConfig } from '../../config/brand';

type ActiveThread = { id: string; trackingId: string };

function CustomerConversation({ thread, onBack }: { thread: ActiveThread; onBack: () => void }) {
  const { messages, loading } = useChatMessages(thread.trackingId, thread.id);
  const { shipment } = useShipmentWithCheckpoints(thread.trackingId);
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { void markThreadRead(thread.id, 'user'); }, [thread.id, messages.length]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);
  const send = async () => {
    if ((!draft.trim() && !file) || sending) return;
    setSending(true); setError('');
    const result = await sendChatMessage({ trackingId: thread.trackingId, threadId: thread.id, sender: 'user', text: draft, mediaFiles: file ? [file] : [] });
    if (result.error) setError(result.error);
    else { setDraft(''); setFile(null); if (fileInput.current) fileInput.current.value = ''; }
    setSending(false);
  };
  const status = shipment ? formatJourneyStatus(getShipmentJourneyState(shipment).status) : 'Shipment';
  const latest = [...(shipment?.checkpoints || [])].sort((a,b) => b.checkpoint_order - a.checkpoint_order)[0];
  return <div className="dhl-chat-shell"><section className="dhl-conversation" aria-label="Shipment support conversation"><header className="dhl-chat-header"><button className="dhl-icon-button" onClick={onBack} aria-label="Back to support"><ChevronLeft size={21}/></button><BrandLogo/><div><strong>{brandConfig.supportName}</strong><small>Secure shipment conversation</small></div></header><div className="dhl-chat-ref">Tracking ID: <strong>{thread.trackingId}</strong>{shipment && <span style={{ marginLeft: 10 }}><StatusBadge status={status}/></span>}</div>
    <div className="dhl-chat-embedded-card"><span className="dhl-eyebrow">Shipment at a glance</span><strong>{thread.trackingId}</strong><div><StatusBadge status={status}/><span>{latest?.location || shipment?.delivery_address || 'Shipment details loading'}</span></div><Link to={`/track/${encodeURIComponent(thread.trackingId)}`}>View tracking <ChevronRight size={15}/></Link></div>
    <div className="dhl-chat-messages" role="log" aria-live="polite">{loading && <p className="dhl-muted">Loading messages…</p>}{!loading && messages.length === 0 && <p className="dhl-muted">Your conversation is ready. Send a message to shipment support.</p>}{messages.map(message => <div key={message.id} className={`dhl-chat-message ${message.sender === 'user' ? 'mine' : ''}`}>{message.sender !== 'user' && <span className="dhl-chat-avatar">{brandConfig.shortName}</span>}<div className="dhl-chat-content"><div className="dhl-chat-bubble">{message.text}{message.media?.map(media => media.type === 'video' ? <video className="dhl-chat-attachment" controls src={media.url} key={media.id}/> : <a href={media.url} target="_blank" rel="noreferrer" key={media.id}><img className="dhl-chat-attachment" src={media.url} alt={media.name || 'Chat attachment'}/></a>)}</div><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div></div>)}<div ref={bottom}/></div>
    {file && <div style={{ padding: '8px 20px', background: 'white', fontSize: 12 }}>Attachment: {file.name} <button className="dhl-text-button" onClick={() => setFile(null)}>Remove</button></div>}{error && <p className="dhl-error-text" style={{ padding: '0 20px' }}>{error}</p>}
    <form className="dhl-chat-composer" onSubmit={event => { event.preventDefault(); void send(); }}><input ref={fileInput} type="file" accept="image/*,video/*" hidden onChange={event => setFile(event.target.files?.[0] || null)}/><button type="button" onClick={() => fileInput.current?.click()} aria-label="Attach image or video"><Paperclip size={21}/></button><textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Type your message…" rows={1} aria-label="Message"/><button className="send" type="submit" disabled={sending || (!draft.trim() && !file)} aria-label="Send message"><Send size={19}/></button></form>
  </section><aside className="dhl-chat-context"><span className="dhl-eyebrow">Shipment context</span><h2>Delivery at a glance</h2><StatusBadge status={status}/><dl><div><dt>TRACKING NUMBER</dt><dd>{thread.trackingId}</dd></div><div><dt>DESTINATION</dt><dd>{shipment?.delivery_address || 'Not available'}</dd></div><div><dt>RECIPIENT</dt><dd>{shipment?.receiver_name || 'Not available'}</dd></div><div><dt>LATEST CHECKPOINT</dt><dd>{latest?.location || 'No checkpoints recorded'}</dd></div></dl><Link className="dhl-secondary-button" to={`/track/${encodeURIComponent(thread.trackingId)}`} style={{ width: '100%' }}>View Full Tracking <ChevronRight size={16}/></Link></aside></div>;
}

export default function UserChat() {
  const [params] = useSearchParams();
  const [trackingId, setTrackingId] = useState(params.get('id') || '');
  const [thread, setThread] = useState<ActiveThread | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const refresh = async () => { const { data } = await supabase.auth.getUser(); if (active) { setAuthenticated(Boolean(data.user)); setCheckingAuth(false); } };
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => { void refresh(); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  const open = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authenticated) { navigate(`/signin?next=${encodeURIComponent(`/chat?id=${trackingId.trim()}`)}`); return; }
    if (!trackingId.trim()) { setError('Enter a tracking number.'); return; }
    setOpening(true); setError('');
    const active = await ensureChatThread(trackingId.trim());
    if (!active) setError('Tracking number not found, or this account is not authorized for the shipment.');
    else setThread({ id: active.id, trackingId: active.trackingId });
    setOpening(false);
  };
  if (thread) return <CustomerConversation thread={thread} onBack={() => setThread(null)}/>;
  return <div className="dhl-support-gate"><PageHeading title="Customer Support" backTo="/home"/><div className="dhl-support-gate-icon"><Headphones size={34}/></div><span className="dhl-eyebrow">Shipment support</span><h1>Connect to Shipment Support</h1><p>Private support conversations are linked to your shipment. Sign in as the sender or recipient to continue.</p><form onSubmit={open}><label htmlFor="support-tracking">Tracking number</label><input id="support-tracking" value={trackingId} onChange={event => setTrackingId(event.target.value)} placeholder="Enter your tracking number" autoComplete="off"/>{error && <p className="dhl-error-text" role="alert">{error}</p>}<button className="dhl-primary-button" type="submit" disabled={checkingAuth || opening}>{checkingAuth ? 'Checking account…' : opening ? 'Verifying shipment…' : authenticated ? 'Continue to Chat' : 'Sign In to Continue'} <ChevronRight size={18}/></button></form><p style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 22, fontSize: 12 }}><ShieldCheck size={16}/> Access is verified against your shipment account.</p></div>;
}
