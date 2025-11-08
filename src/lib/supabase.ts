// Supabase client setup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Using fallback to JSON database.');
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false, // We're using our own auth system
    },
  }
);

// Database types
export interface UniversityRow {
  id: string;
  name: string;
  city: string;
  state: string;
  di_code: number;
  zip: string | null;
  enrollment: number;
  url: string | null;
  max_credits: number;
  transcription_fee: number;
  score_validity_years: number;
  can_use_for_failed_courses: boolean;
  can_enrolled_students_use_clep: boolean;
  msea_org_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CLEPExamPolicyRow {
  id: string;
  university_id: string;
  exam_name: string;
  minimum_score: number | null;
  credits_awarded: number | null;
  course_equivalent: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstitutionUpdateRow {
  id: string;
  institution_di_code: number;
  exam_name: string;
  min_score: string | null;
  credits: string | null;
  course_code: string | null;
  last_updated: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}
