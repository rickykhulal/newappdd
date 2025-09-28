import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_anon_key') {
  console.warn('Supabase not configured. Using placeholder client.');
  // Create a mock client that won't crash the app
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      eq: function() { return this; },
      order: function() { return this; }
    }),
    channel: () => ({
      on: function() { return this; },
      subscribe: () => ({ unsubscribe: () => {} })
    }),
    removeChannel: () => {}
  } as any;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };