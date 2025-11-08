-- Create table for storing exam policy feedback
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS exam_policy_feedback (
  id BIGSERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL,
  exam_name TEXT NOT NULL,
  feedback TEXT NOT NULL CHECK (feedback IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, exam_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_policy_feedback_college_id ON exam_policy_feedback(college_id);
CREATE INDEX IF NOT EXISTS idx_exam_policy_feedback_exam_name ON exam_policy_feedback(exam_name);
CREATE INDEX IF NOT EXISTS idx_exam_policy_feedback_feedback ON exam_policy_feedback(feedback);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_exam_policy_feedback_updated_at 
  BEFORE UPDATE ON exam_policy_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE exam_policy_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read feedback (public read)
CREATE POLICY "Allow public read access" ON exam_policy_feedback
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert feedback (public write)
CREATE POLICY "Allow public insert access" ON exam_policy_feedback
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update feedback (public update)
CREATE POLICY "Allow public update access" ON exam_policy_feedback
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anyone to delete feedback (public delete)
CREATE POLICY "Allow public delete access" ON exam_policy_feedback
  FOR DELETE
  USING (true);

