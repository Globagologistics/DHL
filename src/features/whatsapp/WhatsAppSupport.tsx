import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, X } from 'lucide-react';
import { subscribeToSettings } from '../../services/settings/settingsStore';
import { buildWhatsAppLink, getWhatsAppSettings } from '../../services/settings/whatsappConfigService';
import { defaultWhatsAppSettings } from '../settings/defaults';
import type { WhatsAppSettings } from '../settings/types';

/** WhatsApp-style glyph drawn to sit with the DHL line icons (not the official logo). */
export function WhatsAppIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M9.1 7.9c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2.1.4 0 .6l-.4.6c-.1.2-.2.3 0 .6.4.7 1.3 1.7 2.4 2.2.3.1.4.1.6-.1l.6-.7c.2-.2.3-.2.6-.1l1.5.7c.3.1.4.2.4.4 0 .6-.3 1.3-.9 1.6-.6.3-1.4.4-2.6-.1-1.6-.6-3.2-2.1-4-3.5-.7-1.2-.7-2.3-.4-3Z" fill="currentColor" />
  </svg>;
}

/** Reads the configured WhatsApp destination and rebuilds when Admin Settings saves. */
export function useWhatsAppSupport() {
  const [settings, setSettings] = useState<WhatsAppSettings>(defaultWhatsAppSettings);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = (fresh = false) => { void getWhatsAppSettings({ fresh }).then(record => { if (active) { setSettings(record.value); setLoading(false); } }); };
    load();
    const unsubscribe = subscribeToSettings(key => { if (key === 'whatsapp') load(); });
    return () => { active = false; unsubscribe(); };
  }, []);
  return {
    loading,
    label: settings.displayLabel || 'WhatsApp Support',
    linkFor: (trackingId?: string | null) => buildWhatsAppLink(settings, trackingId),
  };
}

type ButtonProps = { trackingId?: string | null; className?: string; children?: ReactNode };

/**
 * Opens WhatsApp with a prefilled message. When no number is configured it
 * explains that and offers Customer Support instead of a dead link.
 */
export function WhatsAppSupportButton({ trackingId, className = 'dhl-whatsapp-action', children }: ButtonProps) {
  const whatsapp = useWhatsAppSupport();
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const href = whatsapp.linkFor(trackingId);
  const content = children ?? <><WhatsAppIcon size={18} /> {whatsapp.label}</>;
  if (href) return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  return <>
    <button type="button" className={className} onClick={() => setUnavailableOpen(true)} disabled={whatsapp.loading}>{content}</button>
    {unavailableOpen && <WhatsAppUnavailableDialog onClose={() => setUnavailableOpen(false)} />}
  </>;
}

export function WhatsAppUnavailableDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="dhl-modal-wrap" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dhl-modal dhl-whatsapp-dialog" role="dialog" aria-modal="true" aria-labelledby="whatsapp-unavailable-title">
      <div className="dhl-modal-head"><h2 id="whatsapp-unavailable-title">WhatsApp Support</h2><button className="dhl-icon-button" type="button" onClick={onClose} aria-label="Close"><X size={22} /></button></div>
      <span className="dhl-whatsapp-dialog-icon"><WhatsAppIcon size={26} /></span>
      <p>WhatsApp Support isn’t available right now. Our shipment support team can still help you in the app.</p>
      <Link className="dhl-primary-button" to="/chat" onClick={onClose}><Headphones size={18} /> Contact Customer Support</Link>
    </section>
  </div>;
}
