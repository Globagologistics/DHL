import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide a stub for both development and preview/demo builds without credentials
  console.warn('⚠️ Supabase credentials not found. Using stub client for preview mode.');
    
    // Simple in-memory DB for development to simulate Supabase
    const inMemoryDB: Record<string, any[]> = {
      shipments: [],
      checkpoints: [],
    };

    const createQueryBuilder = (table?: string) => {
      const state: any = { table, filters: {}, order: null, limitNum: null };

      const runQuery = () => {
        let rows = (inMemoryDB[state.table] || []).slice();
        // apply filters (iterate over filter object)
        for (const [field, value] of Object.entries(state.filters)) {
          rows = rows.filter((r: any) => String(r[field]) === String(value));
        }
        // apply order
        if (state.order) {
          const { field, ascending } = state.order;
          rows.sort((a: any, b: any) => {
            if (a[field] === b[field]) return 0;
            return (a[field] > b[field] ? 1 : -1) * (ascending ? 1 : -1);
          });
        }
        if (state.limitNum != null) rows = rows.slice(0, state.limitNum);
        return rows;
      };

      const builder: any = {
        select: (_cols?: string) => builder,
        eq: (field: string, value: any) => { 
          console.log(`🔍 Stub filter: ${state.table}.${field} = ${value}`);
          state.filters[field] = value;
          return builder; 
        },
        order: (field: string, opts?: { ascending?: boolean }) => { 
          console.log(`📊 Stub order: ${state.table}.${field} ${opts?.ascending ? 'ASC' : 'DESC'}`);
          state.order = { field, ascending: opts?.ascending ?? true }; 
          return builder; 
        },
        limit: (n: number) => { 
          state.limitNum = n; 
          return builder; 
        },
        single: async () => {
          const rows = runQuery();
          const result = rows[0] || null;
          console.log(`✅ Stub single query returned:`, result?.id || result);
          return { data: result, error: null };
        },
        then: function (resolve: any) {
          try {
            const rows = runQuery();
            console.log(`✅ Stub query returned ${rows.length} rows from ${state.table}`);
            resolve({ data: rows, error: null });
          } catch (e) {
            console.error(`❌ Stub query error:`, e);
            resolve({ data: null, error: e });
          }
        },
      };

      return builder;
    };

    supabase = {
      from: (tableName?: string) => {
        const makeId = () => {
          try {
            // prefer crypto.randomUUID when available
            return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          } catch (e) {
            return `dev-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          }
        };

        const insert = (payload: any) => {
          return {
            select: (cols?: string) => {
              const createRow = (p: any) => {
                const row = { ...(p || {}), id: p?.id || makeId(), created_at: p?.created_at || new Date().toISOString() };
                console.log(`✅ Stub inserting ${tableName} row:`, row);
                return row;
              };
              const created = Array.isArray(payload) ? payload.map(createRow) : createRow(payload);
              const rows = Array.isArray(created) ? created : [created];
              inMemoryDB[tableName || ''] = (inMemoryDB[tableName || ''] || []).concat(rows);
              console.log(`📊 Stub DB ${tableName} now has ${inMemoryDB[tableName || ''].length} rows`);
              return {
                single: async () => {
                  const result = Array.isArray(created) ? created[0] : created;
                  console.log(`✅ Returning single row from insert:`, result);
                  return { data: result, error: null };
                },
              };
            },
          };
        };

        const update = async (updates: any) => {
          // naive update: apply updates to all rows
          const rows = inMemoryDB[tableName || ''] || [];
          for (let i = 0; i < rows.length; i++) {
            rows[i] = { ...rows[i], ...updates };
          }
          inMemoryDB[tableName || ''] = rows;
          return { data: rows, error: null };
        };

        const del = async () => ({ error: null });

        return {
          select: (cols?: string) => createQueryBuilder(tableName),
          insert,
          update,
          delete: del,
        };
      },
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase credentials are required to sign in.') }),
        signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase credentials are required to create an account.') }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      channel: () => ({
        on: function() { return this; },
        subscribe: function() { 
          return { 
            unsubscribe: async () => {} 
          }; 
        },
        unsubscribe: async () => {},
      }),
      storage: {
        from: () => ({
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          download: async () => ({ data: null, error: null }),
          upload: async () => ({ data: null, error: null }),
        }),
      },
    };
} else {
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    console.warn('âš ï¸ Using VITE_SUPABASE_PUBLISHABLE_KEY. Consider renaming to VITE_SUPABASE_ANON_KEY for clarity.');
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
