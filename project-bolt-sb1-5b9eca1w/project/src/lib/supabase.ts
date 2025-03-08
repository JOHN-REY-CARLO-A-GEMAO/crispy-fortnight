import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase URL format
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Use development credentials if not connected to Supabase
const defaultUrl = 'https://example.supabase.co';
const defaultKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.z2GdR3jJWl1Zc3vBp3qKzvTFxhDhQXA3N3YKILhXjwE';

const finalUrl = isValidUrl(supabaseUrl || '') ? supabaseUrl : defaultUrl;
const finalKey = supabaseAnonKey || defaultKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase credentials. Please click "Connect to Supabase" to set up your project.\n' +
    'Using development credentials for now.'
  );
}

export const supabase = createClient(finalUrl, finalKey);