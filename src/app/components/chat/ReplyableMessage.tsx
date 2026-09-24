import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { CornerUpLeft, Headphones, UserRound } from 'lucide-react';
import type { ChatMessage, ChatRole } from '../../../types/chat';
import { supportAgentFor } from '../../../config/supportAgents';
import { QuotedReply, replyLabel } from './ReplyElements';

type Props = { message: ChatMessage; activeRole: ChatRole; onReply: (message: ChatMessage) => void; className?: string; avatarClassName?: string; compact?: boolean };

export function ReplyableMessage({ message, activeRole, onReply, className = '', avatarClassName = '', compact = false }: Props) {
  const [offset, setOffset] = useState(0);
  const start = useRef<{x:number;y:number;locked:boolean} | null>(null);
  const isMine = message.sender === activeRole;
  const persona = supportAgentFor(message.supportProfileId);
  const threshold = 64;
  const handleDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    start.current = { x: event.clientX, y: event.clientY, locked: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = start.current; if (!point) return;
    const deltaX = event.clientX - point.x; const deltaY = event.clientY - point.y;
    if (!point.locked && Math.abs(deltaY) > 12) { start.current = null; setOffset(0); return; }
    if (Math.abs(deltaX) > 10) point.locked = true;
    if (!point.locked) return;
    const direction = isMine ? -1 : 1;
    const translated = Math.max(0, Math.min(86, deltaX * direction));
    setOffset(direction * translated);
  };
  const finish = () => { if (Math.abs(offset) >= threshold) onReply(message); setOffset(0); start.current = null; };
  return <div className={`dhl-replyable-message ${isMine ? 'mine' : ''} ${offset ? 'swiping' : ''} ${className}`} onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={finish} onPointerCancel={() => { setOffset(0); start.current = null; }}>
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
          <button type="button" className="dhl-message-reply-button" onClick={() => onReply(message)} aria-label={`Reply to ${replyLabel(message)}`}><CornerUpLeft size={15} /></button>
        </div>
        <small>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
      </div>
    </div>
  </div>;
}
