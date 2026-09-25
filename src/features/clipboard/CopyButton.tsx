import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { COPY_FAILURE_MESSAGE, useCopyAction } from '../../hooks/useCopyAction';

type Props = {
  /** Resolved when the button is pressed, so the link always uses the live origin. */
  value: string | (() => string);
  label: ReactNode;
  copiedLabel?: ReactNode;
  icon?: ReactNode;
  className?: string;
  title?: string;
  /** Shown beside the button when the clipboard is unavailable. */
  failureMessage?: string;
};

/**
 * The application's single copy control: copies, confirms with "Copied", and
 * on failure reveals a selected field so the value can still be copied by hand.
 */
export function CopyButton({ value, label, copiedLabel = 'Copied', icon, className = 'dhl-admin-button', title, failureMessage = COPY_FAILURE_MESSAGE }: Props) {
  const { copied, failed, copy } = useCopyAction();
  const fallback = useRef<HTMLInputElement>(null);
  const resolved = () => (typeof value === 'function' ? value() : value);

  useEffect(() => {
    if (!failed) return;
    fallback.current?.focus();
    fallback.current?.select();
  }, [failed]);

  return <span className="dhl-copy-action">
    <button type="button" className={className} onClick={() => void copy(resolved())} title={title ?? resolved()}>
      {copied ? <Check size={16} aria-hidden="true" /> : icon ?? <Copy size={16} aria-hidden="true" />}
      {copied ? copiedLabel : label}
    </button>
    {/* The button label already reads "Copied", so success is announced, not repeated on screen. */}
    <CopyStatus copied={copied} failed={failed} failureMessage={failureMessage} silentSuccess />
    {failed && <input ref={fallback} className="dhl-copy-fallback" readOnly value={resolved()} aria-label="Copy this value manually" onFocus={event => event.currentTarget.select()} />}
  </span>;
}

/**
 * Polite announcement shared by every copy control. `silentSuccess` keeps the
 * confirmation for assistive technology only, where the control itself already
 * shows it.
 */
export function CopyStatus({ copied, failed, failureMessage = COPY_FAILURE_MESSAGE, silentSuccess = false }: { copied: boolean; failed: boolean; failureMessage?: string; silentSuccess?: boolean }) {
  const visible = failed || (copied && !silentSuccess);
  return <span className={`dhl-copy-status${failed ? ' failed' : ''}${visible ? ' visible' : ''}`} role="status" aria-live="polite">
    {copied ? '✓ Copied' : failed ? failureMessage : ''}
  </span>;
}
