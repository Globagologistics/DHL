import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { brandConfig } from '../../config/brand';
import { environment } from '../../config/environment';

type GateState = 'loading' | 'ready' | 'verifying' | 'verified' | 'done' | 'error';

/**
 * Development-only visual counterpart of the Netlify Edge gate.
 *
 * Production visitors are stopped before index.html is served, by
 * netlify/edge-functions/human-gate.ts. This component exists so the compact
 * interaction can be inspected under Vite without weakening production access.
 */
export function HumanVerificationGate({ children }: { children: React.ReactNode }) {
  const enabled = environment.localHumanGatePreview;
  const [state, setState] = useState<GateState>(enabled ? 'loading' : 'verified');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    timer.current = window.setTimeout(() => setState('ready'), 1400);
    return () => { if (timer.current !== null) window.clearTimeout(timer.current); };
  }, [enabled]);

  useEffect(() => {
    if (state !== 'verified') return;
    const complete = window.setTimeout(() => setState('done'), 350);
    return () => window.clearTimeout(complete);
  }, [state]);

  if (!enabled || state === 'done') return <>{children}</>;

  const verify = async () => {
    if (state !== 'ready') return;
    setState('verifying');
    // Vite does not run Netlify Functions. This is intentionally a visual
    // preview only; it neither stores a client-side credential nor exists in a
    // production build. The deployed Edge gate always posts to verify-human.
    await new Promise(resolve => window.setTimeout(resolve, 350));
    setState('verified');
  };

  return <>
    <div className="dhl-human-gate-blocked" aria-hidden="true" inert>{children}</div>
    <div className="dhl-human-gate-scene" aria-hidden="true">
      <picture><source media="(min-width: 900px) and (orientation: landscape)" srcSet={brandConfig.cinematicLandscape.webp} type="image/webp" /><img src={brandConfig.cinematicPortrait.fallback} alt="" /></picture>
    </div>
    <div className="dhl-human-gate-overlay" role="dialog" aria-modal="true" aria-label="Human confirmation">
      <div className={`dhl-human-gate-bar is-${state}`}>
        {state === 'loading' || state === 'verifying' ? <LoaderCircle className="dhl-human-gate-spinner" size={22} aria-label="Loading" /> : null}
        {state === 'ready' ? <button type="button" className="dhl-human-gate-choice" onClick={() => void verify()}><span className="dhl-human-gate-box" aria-hidden="true" /> <span>Please confirm you’re human</span></button> : null}
        {state === 'verified' ? <><span className="dhl-human-gate-check"><Check size={17} /></span><span>Verified</span></> : null}
        {state === 'error' ? <span>Unable to verify. Please try again.</span> : null}
      </div>
    </div>
  </>;
}
