import { FileImage, X } from 'lucide-react';
import type { ChatMessage } from '../../../types/chat';
import { supportAgentFor } from '../../../config/supportAgents';

export const replyLabel = (message: Pick<ChatMessage, 'sender' | 'senderName' | 'supportProfileId'>) => {
  const persona = supportAgentFor(message.supportProfileId);
  return persona?.name || message.senderName || (message.sender === 'admin' ? 'DHL Shipment Support' : 'Customer');
};

const excerpt = (message: Pick<ChatMessage, 'text' | 'media'>) => message.text?.replace(/\s+/g, ' ').trim() || message.media?.[0]?.name || 'Attachment';

export function QuotedReply({ message }: { message?: ChatMessage['replyTo'] }) {
  if (!message) return <div className="dhl-reply-quote unavailable">Original message unavailable</div>;
  return <div className="dhl-reply-quote"><strong>{replyLabel(message)}</strong><span>{message.media?.length && !message.text ? <><FileImage size={13} /> {excerpt(message)}</> : excerpt(message)}</span></div>;
}

export function ReplyPreview({ message, onCancel }: { message: ChatMessage; onCancel: () => void }) {
  const persona = supportAgentFor(message.supportProfileId);
  return <div className="dhl-reply-preview"><>{persona && <img src={persona.avatar} alt="" />}</><div><small>Replying to {replyLabel(message)}</small><span>{message.media?.length && !message.text ? <><FileImage size={13} /> {excerpt(message)}</> : excerpt(message)}</span></div><button type="button" onClick={onCancel} aria-label="Cancel reply"><X size={17} /></button></div>;
}
