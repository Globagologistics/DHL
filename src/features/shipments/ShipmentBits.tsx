import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { environment } from '../../config/environment';
import { lifecycleLabels, lifecycleTone } from './lifecycle';
import type { LifecycleState } from '../../types/database';

export function LifecycleBadge({ state }: { state: LifecycleState }) {
  const tone = lifecycleTone[state];
  const className = tone === 'delivered' ? 'delivered' : tone === 'alert' ? 'alert' : tone === 'transit' ? 'transit' : 'pending';
  return <span className={`dhl-admin-status ${className}`}>{lifecycleLabels[state]}</span>;
}

/** Public, shareable request form. Never an admin route. */
export const customerFormUrl = () => `${(environment.appUrl || window.location.origin).replace(/\/$/, '')}/shipment-request/new`;

export function CopyFormLinkButton({ className = 'dhl-admin-button' }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(customerFormUrl()); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt('Copy the customer shipment form link:', customerFormUrl()); }
  };
  return <button type="button" className={className} onClick={() => void copy()} title={customerFormUrl()}>{copied ? <Check size={16} /> : <Link2 size={16} />}{copied ? 'Link copied' : 'Copy Customer Shipment Form Link'}</button>;
}

/** wa.me link to a phone number with a prefilled message (opens WhatsApp; nothing is sent automatically). */
export function whatsappToPhone(phone: string | null | undefined, message: string): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
