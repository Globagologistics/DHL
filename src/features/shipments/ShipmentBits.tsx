import { Link2 } from 'lucide-react';
import { appUrlFor } from '../../config/environment';
import { CopyButton } from '../clipboard/CopyButton';
import { lifecycleLabels, lifecycleTone } from './lifecycle';
import type { LifecycleState } from '../../types/database';

export function LifecycleBadge({ state }: { state: LifecycleState }) {
  const tone = lifecycleTone[state];
  const className = tone === 'delivered' ? 'delivered' : tone === 'alert' ? 'alert' : tone === 'transit' ? 'transit' : 'pending';
  return <span className={`dhl-admin-status ${className}`}>{lifecycleLabels[state]}</span>;
}

/** Public, shareable request form. Never an admin route. */
export const customerFormUrl = () => appUrlFor('/shipment-request/new');

export function CopyFormLinkButton({ className = 'dhl-admin-button' }: { className?: string }) {
  return <CopyButton
    value={customerFormUrl}
    className={className}
    icon={<Link2 size={16} aria-hidden="true" />}
    label="Copy Customer Shipment Form Link"
    copiedLabel="Link copied"
  />;
}

/** wa.me link to a phone number with a prefilled message (opens WhatsApp; nothing is sent automatically). */
export function whatsappToPhone(phone: string | null | undefined, message: string): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
