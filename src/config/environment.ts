/** VITE_ variables are public browser configuration. Server credentials stay in Netlify. */
export const environment = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabasePublicKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  appUrl: import.meta.env.VITE_APP_BASE_URL || '',
} as const;

export const hasBackendConfiguration = Boolean(environment.supabaseUrl && environment.supabasePublicKey);
