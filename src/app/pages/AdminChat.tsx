import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Info, MessageCircle, Search, X } from 'lucide-react';
import { deleteSupportMessage, ensureChatThread, markThreadRead, sendChatMessage, useChatMessages, useChatThreads } from '../../hooks/useChat';
import { useShipmentWithCheckpoints } from '../../hooks/useSupabase';
import { useVisualViewportHeight } from '../../hooks/useVisualViewport';
import type { ChatMessage, ChatThreadSummary } from '../../types/chat';
import { AdminContext, type Shipment } from '../contexts/AdminContext';
import { environment } from '../../config/environment';
import { activeSupportAgent } from '../../config/supportAgents';
import { formatTrackingNumber } from '../../services/trackingService';
import { findDevShipment, subscribeDevData } from '../../demo/devDataStore';
import { isDemoThreadId } from '../../demo/demoChatStore';
import { deriveLifecycleState, lifecycleLabels } from '../../features/shipments/lifecycle';
import { LifecycleBadge } from '../../features/shipments/ShipmentBits';
import { ShipmentRouteCard } from '../../features/map/ShipmentRouteCard';
import type { LifecycleState } from '../../types/database';
import { ChatComposer } from '../components/chat/ChatComposer';
import { ReplyableMessage } from '../components/chat/ReplyableMessage';

/**
 * Admin Support Chat, two screens:
 *   /admin/chat            conversation selector (inbox)
 *   /admin/chat/:threadId  dedicated conversation — fixed header, only the
 *                          message list scrolls, composer pinned to the bottom
 */

type ThreadRow = { thread: ChatThreadSummary; customer: string; tracking: string; state: LifecycleState | null };
type Filter = 'all' | 'unread' | 'active';

const relative = (value?: number) => {
  if (!value) return '';
  const minutes = Math.round((Date.now() - value) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?';

/** Joins threads with their shipment (customer name, tracking number, status). */
function useThreadRows() {
  const { shipments } = useContext(AdminContext);
  const { threads, loading } = useChatThreads();
  const [, setVersion] = useState(0);
  useEffect(() => subscribeDevData(() => setVersion(value => value + 1)), []);
  const byId = useMemo(() => new Map<string, Shipment>(shipments.map(item => [item.id, item])), [shipments]);
  const rows: ThreadRow[] = threads.map(thread => {
    const shipment = byId.get(thread.trackingId);
    const dev = shipment ? null : findDevShipment(thread.trackingId);
    const trackingNumber = shipment?.trackingNumber || dev?.tracking_number || null;
    return {
      thread,
      customer: shipment?.receiverName || dev?.receiver_name || 'Customer',
      tracking: trackingNumber ? formatTrackingNumber(trackingNumber) : `Record ${thread.trackingId.slice(0, 8).toUpperCase()}`,
      state: shipment?.lifecycleState || (dev ? deriveLifecycleState(dev) : null),
    };
  });
  return { rows, loading };
}

function ThreadList({ rows, activeId, compact = false }: { rows: ThreadRow[]; activeId?: string; compact?: boolean }) {
  const navigate = useNavigate();
  return <div className={`dhl-inbox-list${compact ? ' compact' : ''}`}>{rows.map(({ thread, customer, tracking, state }) => <button type="button" key={thread.id} className={`dhl-inbox-row${activeId === thread.id ? ' active' : ''}${thread.unreadForAdmin ? ' unread' : ''}`} onClick={() => navigate(`/admin/chat/${thread.id}`)}>
    <span className="dhl-inbox-avatar" aria-hidden="true">{initials(customer)}</span>
    <span className="dhl-inbox-main">
      <span className="dhl-inbox-top"><strong>{customer}</strong><time>{relative(thread.lastMessageAt)}</time></span>
      <span className="dhl-inbox-meta"><span className="mono">{tracking}</span>{state && !compact && <LifecycleBadge state={state} />}{isDemoThreadId(thread.id) && <em className="dhl-admin-demo-badge">DEV</em>}</span>
      <span className="dhl-inbox-preview"><small>{thread.lastMessagePreview || 'No messages yet'}</small>{thread.unreadForAdmin > 0 && <b aria-label={`${thread.unreadForAdmin} unread`}>{thread.unreadForAdmin}</b>}</span>
    </span>
  </button>)}</div>;
}

/** Screen 1: conversation selector. */
function Inbox() {
  const { rows, loading } = useThreadRows();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [opening, setOpening] = useState('');
  const agent = activeSupportAgent();
  // Links from a shipment (?tracking=<record id>) open, or start, its conversation.
  const tracking = params.get('tracking');
  useEffect(() => {
    if (!tracking) return;
    let active = true;
    setOpening('Opening conversation…');
    void ensureChatThread(tracking).then(thread => {
      if (!active) return;
      if (thread) navigate(`/admin/chat/${thread.id}`, { replace: true });
      else setOpening('This conversation could not be opened. Sign in with the administrator account to start new conversations.');
    });
    return () => { active = false; };
  }, [tracking, navigate]);
  const visible = rows.filter(row => {
    const needle = query.trim().toLowerCase().replace(/\s/g, '');
    const matches = !needle || [row.customer, row.tracking, row.thread.lastMessagePreview].join(' ').toLowerCase().replace(/\s/g, '').includes(needle);
    const passes = filter === 'all' || (filter === 'unread' ? row.thread.unreadForAdmin > 0 : Boolean(row.state && ['awaiting_takeoff', 'in_transit', 'paused', 'stopped'].includes(row.state)));
    return matches && passes;
  });
  const unread = rows.filter(row => row.thread.unreadForAdmin > 0).length;
  return <div className="dhl-admin-inbox">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">CUSTOMER OPERATIONS</span><h1>Support &amp; Chat</h1><p>Manage shipment support conversations.</p></div><div className="dhl-inbox-identity"><img src={agent.avatar} alt="" /><span><small>Replying today as</small><strong>{agent.name}</strong></span></div></div>
    {opening && <p className="dhl-admin-banner" role="status">{opening}</p>}
    <section className="dhl-admin-card dhl-inbox-card">
      <div className="dhl-inbox-controls">
        <div className="dhl-admin-list-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search customer or tracking number…" aria-label="Search conversations" /></div>
        <div className="dhl-admin-tabs" role="tablist" aria-label="Conversation filter">{([['all', 'All'], ['unread', `Unread${unread ? ` (${unread})` : ''}`], ['active', 'Active']] as [Filter, string][]).map(([value, label]) => <button key={value} role="tab" type="button" className={filter === value ? 'active' : ''} aria-selected={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      </div>
      {loading && !rows.length ? <div className="dhl-admin-empty">Loading conversations…</div>
        : visible.length ? <ThreadList rows={visible} />
          : <div className="dhl-admin-empty"><MessageCircle size={24} /><strong>No conversations</strong><span>{filter === 'all' ? 'Customer conversations appear here as they start.' : 'Nothing matches this filter.'}</span></div>}
    </section>
  </div>;
}

function ShipmentContextPanel({ shipmentId, onClose }: { shipmentId: string; onClose: () => void }) {
  const { shipment, loading } = useShipmentWithCheckpoints(shipmentId);
  return <aside className="dhl-chat-context-panel" aria-label="Shipment information">
    <header><span>SHIPMENT</span><button type="button" onClick={onClose} aria-label="Close shipment information"><X size={17} /></button></header>
    {loading ? <p className="dhl-settings-notice">Loading shipment…</p> : shipment ? <div className="dhl-chat-context-body">
      <h2>{shipment.package_name || 'Shipment'}</h2>
      <LifecycleBadge state={deriveLifecycleState(shipment)} />
      <dl>
        <div><dt>Tracking number</dt><dd className="mono">{shipment.tracking_number ? formatTrackingNumber(shipment.tracking_number) : 'Not published'}</dd></div>
        <div><dt>Receiver</dt><dd>{shipment.receiver_name}</dd></div>
        <div><dt>Estimated delivery</dt><dd>{shipment.estimated_delivery_at ? new Date(shipment.estimated_delivery_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set'}</dd></div>
        {shipment.customer_status_reason && <div><dt>Customer-visible reason</dt><dd>{shipment.customer_status_reason}</dd></div>}
      </dl>
      <ShipmentRouteCard shipment={shipment} height={180} />
      <Link className="dhl-admin-button" to={`/admin/shipments/${shipment.id}`}>Open Control Panel <ChevronRight size={16} /></Link>
    </div> : <p className="dhl-settings-notice">No shipment details could be loaded for this conversation.</p>}
  </aside>;
}

/** Screen 2: dedicated conversation. */
function Conversation({ threadId }: { threadId: string }) {
  useVisualViewportHeight(true);
  const navigate = useNavigate();
  const { rows } = useThreadRows();
  const row = rows.find(item => item.thread.id === threadId);
  const thread = row?.thread;
  const { messages, loading } = useChatMessages(thread?.trackingId || '', thread?.id, 'admin');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ChatMessage | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [following, setFollowing] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const agent = activeSupportAgent();
  const { isAdmin } = useContext(AdminContext);
  const isDev = isDemoThreadId(threadId);
  // The development bypass exists so an unauthenticated developer cannot write
  // to production conversations. A real administrator session is not a bypass,
  // so it stays free to reply.
  const locked = environment.devAdminBypass && !isAdmin && !isDev;

  useEffect(() => { if (thread) void markThreadRead(thread.id, 'admin'); }, [thread?.id, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (following) bottom.current?.scrollIntoView({ block: 'end' }); else if (messages.length) setNewCount(count => count + 1); }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const onScroll = () => { const area = scroller.current; if (!area) return; const near = area.scrollHeight - area.scrollTop - area.clientHeight < 88; setFollowing(near); if (near) setNewCount(0); };
  const latest = () => { setFollowing(true); setNewCount(0); bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); };
  const send = async (text: string, file: File | null, reply: ChatMessage | null) => {
    if (!thread) return 'Conversation not found.';
    if (locked) return 'Sign in with the administrator account to reply.';
    const result = await sendChatMessage({ trackingId: thread.trackingId, threadId: thread.id, sender: 'admin', text, mediaFiles: file ? [file] : [], replyToMessageId: reply?.id, supportProfileId: agent.id, senderName: agent.name, senderAvatarUrl: agent.avatar });
    setFollowing(true);
    return result.error ? 'Message could not be sent. Please try again.' : null;
  };
  const remove = async () => {
    if (!confirmDelete || !thread) return;
    setDeleteError('');
    const error = await deleteSupportMessage(thread.id, confirmDelete.id);
    if (error) setDeleteError(error); else setConfirmDelete(null);
  };

  if (!thread || !row) return <div className="dhl-admin-empty"><MessageCircle size={24} /><strong>{rows.length ? 'Conversation not found' : 'Loading conversation…'}</strong><Link className="dhl-admin-button" to="/admin/chat">Back to Support &amp; Chat</Link></div>;

  return <div className={`dhl-conversation-page${infoOpen ? ' info-open' : ''}`}>
    <aside className="dhl-conversation-nav" aria-label="Conversations"><div className="dhl-conversation-nav-head"><strong>Conversations</strong><Link to="/admin/chat">All</Link></div><ThreadList rows={rows} activeId={thread.id} compact /></aside>
    <section className="dhl-conversation-main" aria-label={`Conversation with ${row.customer}`}>
      <header className="dhl-conversation-header">
        <button type="button" className="dhl-conversation-back" onClick={() => navigate('/admin/chat')} aria-label="Back to conversations"><ArrowLeft size={20} /></button>
        <span className="dhl-inbox-avatar" aria-hidden="true">{initials(row.customer)}</span>
        <div className="dhl-conversation-title"><strong>{row.customer}</strong><small><span className="mono">{row.tracking}</span>{row.state && <> · {lifecycleLabels[row.state]}</>}</small></div>
        <button type="button" className="dhl-conversation-info" onClick={() => setInfoOpen(open => !open)} aria-label="Shipment information" aria-pressed={infoOpen}><Info size={20} /></button>
      </header>
      <div ref={scroller} onScroll={onScroll} className="dhl-conversation-messages" role="log" aria-live="polite">
        {isDev && <p className="dhl-chat-preview-note">Development conversation · shared with the customer view in this browser</p>}
        {loading && <p className="dhl-admin-chat-notice">Loading conversation…</p>}
        {!loading && !messages.length && <p className="dhl-admin-chat-notice">No messages yet. Start the conversation below.</p>}
        {messages.map(message => <ReplyableMessage key={message.id} message={message} activeRole="admin" onReply={setReplyTo} onDelete={setConfirmDelete} compact />)}
        <div ref={bottom} />
      </div>
      {newCount > 0 && <button type="button" className="dhl-chat-new-message admin" onClick={latest}>New message ↓</button>}
      <div className="dhl-conversation-footer">
        <div className="dhl-admin-public-identity"><img src={agent.avatar} alt="" />Replying as <strong>{agent.name}</strong>{locked && <span>Sign in to send</span>}</div>
        <ChatComposer className="dhl-admin-chat-composer" replyTo={replyTo} onCancelReply={() => setReplyTo(null)} disabled={locked} attachmentDisabled={isDev} onSend={send} placeholder="Type your reply…" />
      </div>
    </section>
    <ShipmentContextPanel shipmentId={thread.trackingId} onClose={() => setInfoOpen(false)} />
    {confirmDelete && <div className="dhl-admin-modal-layer" onMouseDown={event => { if (event.target === event.currentTarget) setConfirmDelete(null); }}>
      <section className="dhl-admin-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <h2 id="delete-title">Delete this message?</h2>
        <p>It will be removed from the customer’s conversation completely. You will still see a “Message deleted” marker here.</p>
        <p className="dhl-lifecycle-note">Emails or notifications already sent about this message cannot be recalled.</p>
        {deleteError && <p className="dhl-admin-banner error" role="alert">{deleteError}</p>}
        <div><button type="button" className="dhl-admin-button" onClick={() => setConfirmDelete(null)}>Cancel</button><button type="button" className="dhl-admin-button danger-solid" onClick={() => void remove()}>Delete Message</button></div>
      </section>
    </div>}
  </div>;
}

export default function AdminChat() {
  const { threadId } = useParams<{ threadId: string }>();
  return threadId ? <Conversation key={threadId} threadId={threadId} /> : <Inbox />;
}
