/**
 * Netlify Edge entry gate. It runs before index.html is served, so an
 * unverified document request receives only this compact bootstrap rather than
 * the SPA bundle. Static assets and Netlify Functions pass through normally.
 */
const COOKIE_NAME = 'human_verified';

const base64urlToBytes = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const bytesToBase64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

async function validToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret || secret.length < 32) return false;
  const [payload, supplied] = token.split('.');
  if (!payload || !supplied) return false;
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('HMAC', key, base64urlToBytes(supplied), new TextEncoder().encode(payload))) return false;
    const data = JSON.parse(new TextDecoder().decode(base64urlToBytes(payload))) as { v?: number; exp?: number };
    return data.v === 1 && typeof data.exp === 'number' && data.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

function cookieValue(header: string | null, name: string) {
  return header?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function bootstrap() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet"><title>Shipment Tracking</title><style>html,body{height:100%;margin:0;background:#191919;font-family:Arial,sans-serif}.scene{position:fixed;inset:0;background:linear-gradient(#0003,#0008),url('/images/dhl-cinematic-portrait.jpg') center/cover;filter:blur(8px) brightness(.65);transform:scale(1.04)}.shade{position:fixed;inset:0;background:#090a0a3d}.gate{position:fixed;inset:0;display:grid;place-items:center;padding:20px}.bar{box-sizing:border-box;width:min(100%,380px);min-height:64px;display:flex;align-items:center;justify-content:center;gap:12px;padding:8px 14px;border:1px solid #ffffff3d;border-radius:14px;background:#141414c7;box-shadow:0 18px 54px #0005;backdrop-filter:blur(14px);color:#fff;font-size:15px;font-weight:600}.choice{min-height:44px;display:flex;align-items:center;gap:12px;border:0;background:transparent;color:#fff;font:inherit;cursor:pointer}.box{display:grid;width:27px;height:27px;place-items:center;flex:0 0 27px;border:2px solid #fff;border-radius:7px}.spin{width:22px;height:22px;border:3px solid #fff5;border-top-color:#fff;border-radius:50%;animation:r .9s linear infinite}@keyframes r{to{transform:rotate(360deg)}}@media(min-width:900px){.scene{background-image:linear-gradient(#0003,#0008),url('/images/dhl-cinematic-landscape.jpg')}}@media(prefers-reduced-motion:reduce){.spin{animation:none}}</style></head><body><div class="scene" aria-hidden="true"></div><div class="shade" aria-hidden="true"></div><main class="gate"><div class="bar" id="bar"><span class="spin" aria-label="Loading"></span></div></main><script>const b=document.getElementById('bar');setTimeout(()=>{b.innerHTML='<button class="choice" id="confirm"><span class="box"></span><span>Please confirm you’re human</span></button>';document.getElementById('confirm').onclick=async()=>{b.innerHTML='<span class="spin"></span>';try{const r=await fetch('/.netlify/functions/verify-human',{method:'POST',headers:{'content-type':'application/json'},body:'{"confirm":true}'});if(!r.ok)throw new Error();b.innerHTML='<span class="box" style="background:#ffcc00;border-color:#ffcc00;color:#191919">✓</span><span>Verified</span>';setTimeout(()=>location.reload(),350)}catch{b.textContent='Unable to verify. Please try again.'}}},1400)</script></body></html>`;
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const accept = request.headers.get('accept') || '';
  const url = new URL(request.url);
  const isDocument = request.method === 'GET' && accept.includes('text/html');
  if (!isDocument || url.pathname.startsWith('/.netlify/')) return context.next();
  const verified = await validToken(cookieValue(request.headers.get('cookie'), COOKIE_NAME), Deno.env.get('DEMO_GATE_SECRET'));
  if (verified) return context.next();
  return new Response(bootstrap(), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow, noarchive, nosnippet' } });
};
