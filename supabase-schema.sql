-- Supabase Database Schema for CLEP University Data
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Universities table
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  di_code INTEGER UNIQUE NOT NULL,
  zip TEXT,
  enrollment INTEGER DEFAULT 0,
  url TEXT,
  max_credits INTEGER DEFAULT 0,
  transcription_fee DECIMAL(10, 2) DEFAULT 0,
  score_validity_years INTEGER DEFAULT 0,
  can_use_for_failed_courses BOOLEAN DEFAULT false,
  can_enrolled_students_use_clep BOOLEAN DEFAULT false,
  msea_org_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLEP Exam Policies table (one-to-many with universities)
CREATE TABLE IF NOT EXISTS clep_exam_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  exam_name TEXT NOT NULL,
  minimum_score INTEGER,
  credits_awarded INTEGER,
  course_equivalent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(university_id, exam_name)
);

-- Institution-specific updates (for localStorage replacement)
CREATE TABLE IF NOT EXISTS institution_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_di_code INTEGER NOT NULL,
  exam_name TEXT NOT NULL,
  min_score TEXT,
  credits TEXT,
  course_code TEXT,
  last_updated DATE DEFAULT CURRENT_DATE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institution_di_code, exam_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_universities_di_code ON universities(di_code);
CREATE INDEX IF NOT EXISTS idx_universities_state ON universities(state);
CREATE INDEX IF NOT EXISTS idx_clep_policies_university_id ON clep_exam_policies(university_id);
CREATE INDEX IF NOT EXISTS idx_clep_policies_exam_name ON clep_exam_policies(exam_name);
CREATE INDEX IF NOT EXISTS idx_institution_updates_di_code ON institution_updates(institution_di_code);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist (for re-running the script)
DROP TRIGGER IF EXISTS update_universities_updated_at ON universities;
DROP TRIGGER IF EXISTS update_clep_policies_updated_at ON clep_exam_policies;
DROP TRIGGER IF EXISTS update_institution_updates_updated_at ON institution_updates;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clep_policies_updated_at BEFORE UPDATE ON clep_exam_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institution_updates_updated_at BEFORE UPDATE ON institution_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE clep_exam_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_updates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Public read access for universities" ON universities;
DROP POLICY IF EXISTS "Public insert access for universities" ON universities;
DROP POLICY IF EXISTS "Public read access for clep_exam_policies" ON clep_exam_policies;
DROP POLICY IF EXISTS "Public insert access for clep_exam_policies" ON clep_exam_policies;
DROP POLICY IF EXISTS "Public read access for institution_updates" ON institution_updates;
DROP POLICY IF EXISTS "Public insert access for institution_updates" ON institution_updates;
DROP POLICY IF EXISTS "Public update access for institution_updates" ON institution_updates;

-- Create policies for public read access (universities and policies are public)
CREATE POLICY "Public read access for universities" ON universities
  FOR SELECT USING (true);

CREATE POLICY "Public insert access for universities" ON universities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for clep_exam_policies" ON clep_exam_policies
  FOR SELECT USING (true);

CREATE POLICY "Public insert access for clep_exam_policies" ON clep_exam_policies
  FOR INSERT WITH CHECK (true);

-- Institution updates: read/write for authenticated users (or public for now)
-- You can restrict this later based on your auth needs
CREATE POLICY "Public read access for institution_updates" ON institution_updates
  FOR SELECT USING (true);

CREATE POLICY "Public insert access for institution_updates" ON institution_updates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for institution_updates" ON institution_updates
  FOR UPDATE USING (true);

