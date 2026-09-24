import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { CornerUpLeft, EyeOff, Headphones, MoreHorizontal, Trash2, UserRound } from 'lucide-react';
import type { ChatMessage, ChatRole } from '../../../types/chat';
import { supportAgentFor } from '../../../config/supportAgents';
import { QuotedReply, replyLabel } from './ReplyElements';

type Props = {
  message: ChatMessage;
  activeRole: ChatRole;
  onReply: (message: ChatMessage) => void;
  /** Admin view only; offered for support-sent messages. */
  onDelete?: (message: ChatMessage) => void;
  className?: string;
  avatarClassName?: string;
  compact?: boolean;
};

const time = (value: number) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * One chat message: swipe to reply on touch, hover Reply on desktop, and for
 * admins a Delete action on support messages. A deleted support message is
 * shown to admins as an audit marker without its original content.
 */
export function ReplyableMessage({ message, activeRole, onReply, onDelete, className = '', avatarClassName = '', compact = false }: Props) {
  const [offset, setOffset] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const start = useRef<{ x: number; y: number; locked: boolean } | null>(null);
  const longPress = useRef<number | null>(null);
  const isMine = message.sender === activeRole;
  const persona = supportAgentFor(message.supportProfileId);
  const canDelete = Boolean(onDelete && message.sender === 'admin' && !message.deletedAt);
  const threshold = 64;
  useEffect(() => () => { if (longPress.current) window.clearTimeout(longPress.current); }, []);

  if (message.deletedAt) {
    return <div className={`dhl-chat-deleted ${isMine ? 'mine' : ''}`} role="note">
      <EyeOff size={14} aria-hidden="true" />
      <span><strong>Message deleted</strong> · Hidden from customer · Deleted at {time(message.deletedAt)}</span>
    </div>;
  }

  const clearLongPress = () => { if (longPress.current) { window.clearTimeout(longPress.current); longPress.current = null; } };
  const handleDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    start.current = { x: event.clientX, y: event.clientY, locked: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    // Long press opens the action menu on touch devices.
    if (canDelete) longPress.current = window.setTimeout(() => { setMenuOpen(true); start.current = null; setOffset(0); }, 520);
  };
  const handleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = start.current; if (!point) return;
    const deltaX = event.clientX - point.x; const deltaY = event.clientY - point.y;
    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) clearLongPress();
    if (!point.locked && Math.abs(deltaY) > 12) { start.current = null; setOffset(0); return; }
    if (Math.abs(deltaX) > 10) point.locked = true;
    if (!point.locked) return;
    const direction = isMine ? -1 : 1;
    const translated = Math.max(0, Math.min(86, deltaX * direction));
    setOffset(direction * translated);
  };
  const finish = () => { clearLongPress(); if (Math.abs(offset) >= threshold) onReply(message); setOffset(0); start.current = null; };

  return <div className={`dhl-replyable-message ${isMine ? 'mine' : ''} ${offset ? 'swiping' : ''} ${className}`} onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={finish} onPointerCancel={() => { clearLongPress(); setOffset(0); start.current = null; }}>
    <span className={`dhl-reply-swipe-indicator${Math.abs(offset) >= threshold ? ' ready' : ''}`} aria-hidden="true"><CornerUpLeft size={17} /></span>
    <div className="dhl-replyable-content" style={{ transform: `translateX(${offset}px)` }}>
      {!isMine && (message.sender === 'admin'
        ? <span className={`dhl-chat-avatar ${avatarClassName}`} aria-label={persona?.name || 'DHL Support'}>{persona ? <img src={persona.avatar} alt="" /> : <Headphones size={15} aria-hidden="true" />}</span>
        : <span className={`dhl-chat-avatar ${avatarClassName}`} aria-label="Customer"><UserRound size={15} aria-hidden="true" /></span>)}
      <div className="dhl-chat-content">
        {!isMine && !compact && <strong className="dhl-chat-sender-name">{persona?.name || message.senderName || 'DHL Shipment Support'}</strong>}
        <div className="dhl-chat-bubble">
          {message.replyToMessageId && <QuotedReply message={message.replyTo} />}
          {message.text && <span className="dhl-chat-message-text">{message.text}</span>}
          {message.media?.map(media => media.type === 'video' ? <video className="dhl-chat-attachment" controls src={media.url} key={media.id} /> : <a href={media.url} target="_blank" rel="noreferrer" key={media.id}><img className="dhl-chat-attachment" src={media.url} alt={media.name || 'Chat attachment'} /></a>)}
          <span className="dhl-message-actions">
            <button type="button" className="dhl-message-reply-button" onClick={() => onReply(message)} aria-label={`Reply to ${replyLabel(message)}`}><CornerUpLeft size={15} /></button>
            {canDelete && <button type="button" className="dhl-message-more-button" onClick={() => setMenuOpen(open => !open)} aria-label="Message actions" aria-expanded={menuOpen}><MoreHorizontal size={15} /></button>}
          </span>
        </div>
        <small>{time(message.createdAt)}</small>
        {menuOpen && <div className="dhl-message-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onReply(message); }}><CornerUpLeft size={15} /> Reply</button>
          {canDelete && <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onDelete?.(message); }}><Trash2 size={15} /> Delete Message</button>}
        </div>}
      </div>
    </div>
  </div>;
}
