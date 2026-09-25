import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'failed';

/** Long enough to read the confirmation, short enough that the button feels live again. */
export const COPY_FEEDBACK_MS = 1800;
export const COPY_SUCCESS_MESSAGE = 'Copied to clipboard';
export const COPY_FAILURE_MESSAGE = 'Unable to copy. Please copy the link manually.';

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i;

/**
 * The async Clipboard API needs a secure context (https, or localhost during
 * development). Where it is unavailable or refused — an http preview, an
 * in-app browser, a denied permission — a temporary selection is copied with
 * the legacy command instead, so the button never silently does nothing.
 */
function legacyCopy(value: string): boolean {
  try {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.setAttribute('aria-hidden', 'true');
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, value.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(field);
    return copied;
  } catch {
    return false;
  }
}

export async function writeToClipboard(value: string): Promise<boolean> {
  if (!value) return false;
  const secure = typeof window !== 'undefined' && (window.isSecureContext || LOCAL_HOSTS.test(window.location.hostname));
  if (secure && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      /* permission refused or a non-focused document: fall through */
    }
  }
  return legacyCopy(value);
}

/**
 * One copy behaviour for the whole application: copy, confirm visibly, reset.
 * `state` drives both the button label and an aria-live status, so the
 * confirmation is announced as well as shown.
 */
export function useCopyAction(resetMs: number = COPY_FEEDBACK_MS) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | null>(null);
  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => clear, []);

  const copy = useCallback(async (value: string) => {
    clear();
    const copied = await writeToClipboard(value);
    setState(copied ? 'copied' : 'failed');
    // A failure leaves the manual fallback on screen for longer than a success.
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setState('idle');
    }, copied ? resetMs : resetMs * 4);
    return copied;
  }, [resetMs]);

  const reset = useCallback(() => { clear(); setState('idle'); }, []);

  return {
    state,
    copied: state === 'copied',
    failed: state === 'failed',
    message: state === 'copied' ? COPY_SUCCESS_MESSAGE : state === 'failed' ? COPY_FAILURE_MESSAGE : '',
    copy,
    reset,
  };
}
