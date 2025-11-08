import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// For frontend use, we'll use the anon key
// Make sure to set these in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

