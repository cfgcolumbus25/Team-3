// Supabase-based institution-specific CLEP exam data management
// Replaces localStorage with Supabase database

import { supabase, type InstitutionUpdateRow } from './supabase';

export interface InstitutionExamData {
  examName: string;
  minScore: string | number;
  credits: string | number;
  courseCode: string;
  lastUpdated: string;
  category?: string;
}

/**
 * Get all CLEP exam data for an institution from Supabase
 */
export async function getInstitutionExamData(institutionDiCode: number): Promise<InstitutionExamData[]> {
  try {
    const { data, error } = await supabase
      .from('institution_updates')
      .select('*')
      .eq('institution_di_code', institutionDiCode)
      .order('exam_name');

    if (error) {
      console.error('Error fetching institution exam data:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => ({
      examName: row.exam_name,
      minScore: row.min_score || '',
      credits: row.credits || '',
      courseCode: row.course_code || '',
      lastUpdated: row.last_updated || 'Never',
      category: row.category || 'General',
    }));
  } catch (error) {
    console.error('Error reading institution exam data:', error);
    return [];
  }
}

/**
 * Save CLEP exam data for an institution to Supabase
 */
export async function saveInstitutionExamData(
  institutionDiCode: number,
  examData: InstitutionExamData[]
): Promise<void> {
  try {
    // Delete existing data for this institution
    const { error: deleteError } = await supabase
      .from('institution_updates')
      .delete()
      .eq('institution_di_code', institutionDiCode);

    if (deleteError) {
      console.error('Error deleting existing data:', deleteError);
    }

    // Insert new data
    const rows: Omit<InstitutionUpdateRow, 'id' | 'created_at' | 'updated_at'>[] = examData.map(exam => ({
      institution_di_code: institutionDiCode,
      exam_name: exam.examName,
      min_score: exam.minScore ? String(exam.minScore) : null,
      credits: exam.credits ? String(exam.credits) : null,
      course_code: exam.courseCode || null,
      last_updated: exam.lastUpdated !== 'Never' ? exam.lastUpdated : new Date().toISOString().split('T')[0],
      category: exam.category || null,
    }));

    const { error: insertError } = await supabase
      .from('institution_updates')
      .insert(rows);

    if (insertError) {
      console.error('Error saving institution exam data:', insertError);
      throw new Error('Failed to save exam data');
    }
  } catch (error) {
    console.error('Error saving institution exam data:', error);
    throw new Error('Failed to save exam data');
  }
}

/**
 * Update a specific exam's data for an institution in Supabase
 */
export async function updateInstitutionExam(
  institutionDiCode: number,
  examName: string,
  updates: Partial<InstitutionExamData>
): Promise<boolean> {
  try {
    const updateData: Partial<InstitutionUpdateRow> = {};

    if (updates.minScore !== undefined) {
      updateData.min_score = updates.minScore ? String(updates.minScore) : null;
    }
    if (updates.credits !== undefined) {
      updateData.credits = updates.credits ? String(updates.credits) : null;
    }
    if (updates.courseCode !== undefined) {
      updateData.course_code = updates.courseCode || null;
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category || null;
    }

    // Always update last_updated
    updateData.last_updated = new Date().toISOString().split('T')[0];

    // Try to update existing record
    const { data: existing, error: fetchError } = await supabase
      .from('institution_updates')
      .select('id')
      .eq('institution_di_code', institutionDiCode)
      .eq('exam_name', examName)
      .single();

    if (existing && !fetchError) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('institution_updates')
        .update(updateData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating institution exam:', updateError);
        return false;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('institution_updates')
        .insert({
          institution_di_code: institutionDiCode,
          exam_name: examName,
          min_score: updateData.min_score,
          credits: updateData.credits,
          course_code: updateData.course_code,
          last_updated: updateData.last_updated,
          category: updateData.category,
        });

      if (insertError) {
        console.error('Error inserting institution exam:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating institution exam:', error);
    return false;
  }
}

/**
 * Initialize default exam data for an institution if none exists
 * This is a no-op for Supabase since we don't need to pre-populate
 */
export async function initializeDefaultExamData(institutionDiCode: number): Promise<void> {
  // Check if data exists
  const existing = await getInstitutionExamData(institutionDiCode);
  if (existing.length > 0) {
    return; // Already has data
  }
  // For Supabase, we don't need to initialize defaults
  // The data will be created when institutions make updates
}

/**
 * Get a single exam's data
 */
export async function getInstitutionExam(
  institutionDiCode: number,
  examName: string
): Promise<InstitutionExamData | null> {
  try {
    const { data, error } = await supabase
      .from('institution_updates')
      .select('*')
      .eq('institution_di_code', institutionDiCode)
      .eq('exam_name', examName)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      examName: data.exam_name,
      minScore: data.min_score || '',
      credits: data.credits || '',
      courseCode: data.course_code || '',
      lastUpdated: data.last_updated || 'Never',
      category: data.category || 'General',
    };
  } catch (error) {
    console.error('Error getting institution exam:', error);
    return null;
  }
}
