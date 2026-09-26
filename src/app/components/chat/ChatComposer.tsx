import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import type { ChatMessage } from '../../../types/chat';
import { ReplyPreview } from './ReplyElements';

type Props = {
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (text: string, file: File | null, replyTo: ChatMessage | null) => Promise<string | null>;
  disabled?: boolean;
  attachmentDisabled?: boolean;
  className?: string;
  placeholder?: string;
};

export function ChatComposer({ replyTo, onCancelReply, onSend, disabled = false, attachmentDisabled = false, className = '', placeholder = 'Type your message…' }: Props) {
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // A local preview of the chosen file, released as soon as it is replaced.
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const input = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const resize = () => { const field = input.current; if (!field) return; field.style.height = 'auto'; field.style.height = `${Math.min(field.scrollHeight, 144)}px`; };
  useEffect(resize, [draft]);
  useEffect(() => { if (replyTo) { input.current?.focus(); } }, [replyTo]);
  const send = async () => {
    const text = draft.trimEnd();
    if ((!text.trim() && !file) || sending || disabled) return;
    setSending(true); setError('');
    const sendError = await onSend(text, file, replyTo);
    if (sendError) { setError(sendError); setSending(false); return; }
    setDraft(''); setFile(null); setPreview(null); onCancelReply();
    if (fileInput.current) fileInput.current.value = '';
    if (input.current) { input.current.style.height = ''; input.current.focus(); }
    setSending(false);
  };
  return <>
    {replyTo && <ReplyPreview message={replyTo} onCancel={onCancelReply} />}
    {file && <div className="dhl-chat-attachment-preview">
      {file.type.startsWith('video/')
        ? <video src={preview || undefined} muted playsInline />
        : <img src={preview || undefined} alt="Selected attachment" />}
      <button type="button" className="dhl-chat-attachment-remove" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }} aria-label="Remove attachment"><X size={16} /></button>
      {sending && <span className="dhl-chat-attachment-sending" role="status">Sending…</span>}
    </div>}
    {error && <p className="dhl-error-text dhl-chat-send-error" role="alert">{error}</p>}
    <form className={`dhl-chat-composer ${className}`} onSubmit={event => { event.preventDefault(); void send(); }}>
      {!attachmentDisabled && <input ref={fileInput} type="file" accept="image/*,video/*" hidden onChange={event => setFile(event.target.files?.[0] || null)} />}
      <button type="button" className="dhl-chat-attach" onClick={() => fileInput.current?.click()} disabled={disabled || attachmentDisabled} aria-label="Attach image or video"><Paperclip size={21} /></button>
      <textarea ref={input} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void send(); } }} placeholder={placeholder} rows={1} aria-label="Message" disabled={disabled} />
      <button className="send" type="submit" disabled={disabled || sending || (!draft.trim() && !file)} aria-label="Send message"><Send size={19} /></button>
    </form>
  </>;
}
