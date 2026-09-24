/** VITE_ variables are public browser configuration. Server credentials stay in Netlify. */
export const environment = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabasePublicKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  appUrl: import.meta.env.VITE_APP_BASE_URL || '',
  demoSupportAccess: import.meta.env.DEV && import.meta.env.VITE_DEMO_SUPPORT_ACCESS === 'true',
  enableAdminShortcut: import.meta.env.DEV && import.meta.env.VITE_ENABLE_ADMIN_SHORTCUT === 'true',
  devAdminBypass: import.meta.env.DEV && import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true',
} as const;

export const hasBackendConfiguration = Boolean(environment.supabaseUrl && environment.supabasePublicKey);
