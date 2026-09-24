/** VITE_ variables are public browser configuration. Server credentials stay in Netlify. */
export const environment = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabasePublicKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  appUrl: import.meta.env.VITE_APP_BASE_URL || '',
  /** Base path of the authenticated server functions (Netlify). */
  serverFunctionsBase: import.meta.env.VITE_SERVER_FUNCTIONS_BASE || '/.netlify/functions',
  /** Bootstrap WhatsApp number used only until Admin > Settings stores one. Not a secret. */
  whatsappFallbackNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '',
  demoSupportAccess: import.meta.env.DEV && import.meta.env.VITE_DEMO_SUPPORT_ACCESS === 'true',
  enableAdminShortcut: import.meta.env.DEV && import.meta.env.VITE_ENABLE_ADMIN_SHORTCUT === 'true',
  devAdminBypass: import.meta.env.DEV && import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true',
  /** Development-only settings store in this browser. Never used for credentials. */
  settingsDevAdapter: import.meta.env.DEV && import.meta.env.VITE_SETTINGS_DEV_ADAPTER === 'true',
} as const;

export const hasBackendConfiguration = Boolean(environment.supabaseUrl && environment.supabasePublicKey);
