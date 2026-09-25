/** VITE_ variables are public browser configuration. Server credentials stay in Netlify. */
export const environment = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabasePublicKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  appUrl: import.meta.env.VITE_APP_BASE_URL || '',
  /** Base path of the authenticated server functions (Netlify). */
  serverFunctionsBase: import.meta.env.VITE_SERVER_FUNCTIONS_BASE || '/.netlify/functions',
  /** Bootstrap WhatsApp number used only until Admin > Settings stores one. Not a secret. */
  whatsappFallbackNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '',
  /** Development-only demo shipment 010101010101 (src/demo). Never active in production builds. */
  demoShipment: import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_SHIPMENT === 'true',
  enableAdminShortcut: import.meta.env.DEV && import.meta.env.VITE_ENABLE_ADMIN_SHORTCUT === 'true',
  devAdminBypass: import.meta.env.DEV && import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true',
  /** Development-only settings store in this browser. Never used for credentials. */
  settingsDevAdapter: import.meta.env.DEV && import.meta.env.VITE_SETTINGS_DEV_ADAPTER === 'true',
  /** Vite-only inspection of the deployed Netlify Edge verification gate. */
  localHumanGatePreview: import.meta.env.DEV && import.meta.env.VITE_HUMAN_GATE_LOCAL_PREVIEW === 'true',
} as const;

export const hasBackendConfiguration = Boolean(environment.supabaseUrl && environment.supabasePublicKey);

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i;
const isLocal = (host: string) => LOCAL_HOSTS.test(host);

/**
 * Absolute base for links people share (the customer shipment form, password
 * links). VITE_APP_BASE_URL wins, except when a development value was baked
 * into a deployed build: a localhost base copied from a real host would send
 * the recipient nowhere, so the live origin is the honest answer there.
 */
export function appBaseUrl(): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const configured = environment.appUrl.trim().replace(/\/+$/, '');
  if (!configured) return origin;
  try {
    const parsed = new URL(configured);
    if (origin && isLocal(parsed.hostname) && !isLocal(window.location.hostname)) return origin;
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  } catch {
    return origin;
  }
}

/** Absolute URL for a customer-facing path such as `/shipment-request/new`. */
export const appUrlFor = (path: string) => `${appBaseUrl()}/${path.replace(/^\/+/, '')}`;
