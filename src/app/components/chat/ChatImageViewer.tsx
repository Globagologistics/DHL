import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, LoaderCircle, X } from 'lucide-react';
import { downloadChatAttachment } from '../../../hooks/useChat';
import type { MediaAttachment } from '../../../types/chat';

/**
 * Full-screen viewer for an authorized chat attachment.
 *
 * The image is the one already signed for this viewer, so opening it never
 * leaves the application for a raw storage URL and never widens access:
 * someone who cannot read the conversation cannot sign its media either.
 */
export function ChatImageViewer({ media, onClose }: { media: MediaAttachment; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // The page behind must not scroll while the viewer owns the screen.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [onClose]);

  const save = useCallback(async () => {
    setSaving(true); setError('');
    const failure = await downloadChatAttachment(media);
    if (failure) setError(failure);
    setSaving(false);
  }, [media]);

  return createPortal(
    <div className="dhl-image-viewer" role="dialog" aria-modal="true" aria-label={media.name || 'Chat image'} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="dhl-image-viewer-bar">
        <button type="button" onClick={() => void save()} disabled={saving} className="dhl-image-viewer-action">
          {saving ? <LoaderCircle size={17} className="dhl-image-viewer-spin" aria-hidden="true" /> : <Download size={17} aria-hidden="true" />}
          Download Image
        </button>
        <button type="button" onClick={onClose} className="dhl-image-viewer-close" aria-label="Close image"><X size={20} /></button>
      </div>
      {media.type === 'video'
        ? <video className="dhl-image-viewer-media" src={media.url} controls autoPlay />
        : <img className="dhl-image-viewer-media" src={media.url} alt={media.name || 'Chat attachment'} />}
      {error && <p className="dhl-image-viewer-error" role="alert">{error}</p>}
    </div>,
    document.body
  );
}
