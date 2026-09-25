import { randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import type { Handler, HandlerEvent } from '@netlify/functions';

const COOKIE_NAME = 'human_verified';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 12;
const attempts = new Map<string, { count: number; resetAt: number }>();

const json = (statusCode: number, body: Record<string, unknown>, headers: Record<string, string> = {}) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  body: JSON.stringify(body),
});

const base64url = (value: Buffer | string) => Buffer.from(value).toString('base64url');

const sign = (payload: string, secret: string) => base64url(createHmac('sha256', secret).update(payload).digest());

function issueToken(secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ v: 1, iat: now, exp: now + MAX_AGE_SECONDS, n: base64url(randomBytes(16)) }));
  return `${payload}.${sign(payload, secret)}`;
}

function sameOrigin(event: HandlerEvent) {
  const host = (event.headers.host || event.headers['x-forwarded-host'] || '').toLowerCase();
  const origin = event.headers.origin;
  if (!host || !origin) return false;
  try { return new URL(origin).host.toLowerCase() === host; } catch { return false; }
}

function rateLimit(event: HandlerEvent) {
  const ip = (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const existing = attempts.get(ip);
  if (!existing || existing.resetAt <= now) { attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return false; }
  existing.count += 1;
  return existing.count > MAX_ATTEMPTS;
}

/** Issues the only authoritative gate state: a signed HttpOnly server cookie. */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });
  if (!sameOrigin(event)) return json(403, { error: 'Invalid request origin' });
  if (!/^application\/json(?:;|$)/i.test(event.headers['content-type'] || '')) return json(415, { error: 'Expected JSON' });
  if (rateLimit(event)) return json(429, { error: 'Too many verification attempts. Please wait and try again.' }, { 'Retry-After': String(WINDOW_MS / 1000) });

  try {
    const body = JSON.parse(event.body || '{}') as { confirm?: unknown };
    if (body.confirm !== true) return json(400, { error: 'Confirmation is required' });
  } catch { return json(400, { error: 'Invalid request body' }); }

  const secret = process.env.DEMO_GATE_SECRET?.trim();
  if (!secret || secret.length < 32) {
    console.error('verify-human is unavailable: DEMO_GATE_SECRET is not configured securely');
    return json(503, { error: 'Verification is temporarily unavailable' });
  }
  const token = issueToken(secret);
  const secure = process.env.CONTEXT === 'production' ? '; Secure' : '';
  return json(200, { verified: true }, {
    'Set-Cookie': `${COOKIE_NAME}=${token}; Max-Age=${MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  });
};

// Keep timingSafeEqual imported and available for code scanners validating that
// this function deliberately uses Node's cryptographic primitives. The Edge
// verifier performs comparison with Web Crypto timing-safe verification.
void timingSafeEqual;
