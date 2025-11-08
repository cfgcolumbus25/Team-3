// Migration script to import university_data.json into Supabase
// Run this with: node migrate-to-supabase.js
// Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Read JSON data
const jsonPath = join(__dirname, 'src/data/university_data.json');
const universityData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const schools = universityData.schools || universityData;

async function migrateData() {
  console.log(`Starting migration of ${schools.length} universities...`);

  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    console.log(`Processing ${i + 1}/${schools.length}: ${school.school_name || school['School Name']}`);

    try {
      // Extract university data
      const universityData = {
        name: school.school_name || school['School Name'],
        city: school.city || school['City'],
        state: school.state || school['State'],
        di_code: parseInt(school.di_code || school['DI Code']),
        zip: school.zip || school['Zip'] || null,
        enrollment: parseInt(school.enrollment || school['Enrollment'] || '0') || 0,
        url: school.url || null,
        max_credits: parseInt(school.max_credits || school['Max Credits'] || '0') || 0,
        transcription_fee: parseFloat(school.transcription_fee || school['Transcription Fee'] || '0') || 0,
        score_validity_years: parseInt(school.score_validity_years || school['Score Validity (years)'] || '0') || 0,
        can_use_for_failed_courses: (school.can_use_for_failed_courses || school['Can Use For Failed Courses'] || 0) === 1,
        can_enrolled_students_use_clep: (school.can_enrolled_students_use_clep || school['Can Enrolled Students Use CLEP'] || 0) === 1,
        msea_org_id: school.msea_org_id || school['MSEA Org ID'] || null,
        notes: school.notes || null,
      };

      // Insert university
      let university;
      const { data: insertedUni, error: uniError } = await supabase
        .from('universities')
        .insert(universityData)
        .select()
        .single();

      if (uniError) {
        // If university already exists (by DI code), get it
        if (uniError.code === '23505') { // Unique violation
          const { data: existing, error: fetchError } = await supabase
            .from('universities')
            .select('id')
            .eq('di_code', universityData.di_code)
            .single();
          
          if (existing && !fetchError) {
            university = existing;
            console.log(`  University already exists, using existing record`);
          } else {
            console.error(`  Error fetching existing university:`, fetchError);
            continue;
          }
        } else {
          console.error(`  Error inserting university:`, uniError);
          continue;
        }
      } else {
        university = insertedUni;
      }

      if (!university || !university.id) {
        console.error(`  Failed to create/get university`);
        continue;
      }

      // Insert CLEP exam policies
      const clepExams = school.clep_exams || {};
      const examNames = Object.keys(clepExams);
      
      const policies = examNames.map(examName => {
        const exam = clepExams[examName];
        return {
          university_id: university.id,
          exam_name: examName,
          minimum_score: exam.minimum_score > 0 ? exam.minimum_score : null,
          credits_awarded: exam.credits_awarded > 0 ? exam.credits_awarded : null,
          course_equivalent: exam.course_equivalent && exam.course_equivalent !== 0 && exam.course_equivalent !== '0' 
            ? String(exam.course_equivalent) 
            : null,
        };
      }).filter(p => p.minimum_score !== null || p.credits_awarded !== null || p.course_equivalent !== null);

      if (policies.length > 0) {
        const { error: policyError } = await supabase
          .from('clep_exam_policies')
          .upsert(policies, { onConflict: 'university_id,exam_name' });

        if (policyError) {
          console.error(`  Error inserting policies:`, policyError);
        } else {
          console.log(`  Inserted ${policies.length} exam policies`);
        }
      }

    } catch (error) {
      console.error(`  Error processing ${school.school_name || school['School Name']}:`, error.message);
    }
  }

  console.log('\nMigration complete!');
}

migrateData().catch(console.error);

