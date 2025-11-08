// Supabase-based university database implementation
// Falls back to JSON if Supabase is not configured

import { supabase, type UniversityRow, type CLEPExamPolicyRow } from './supabase';
import universityData from '../data/university_data.json';

// Type definitions
export interface CLEPExamPolicy {
  examName: string;
  minimumScore: number | null;
  creditsAwarded: number | null;
  classEquivalent: string | null;
}

export interface University {
  id: number;
  name: string;
  city: string;
  state: string;
  diCode: number;
  zip: string;
  enrollment: number;
  url: string;
  maxCredits: number;
  transcriptionFee: number;
  scoreValidityYears: number;
  canUseForFailedCourses: boolean;
  canEnrolledStudentsUseCLEP: boolean;
  mseaOrgId: string;
  examsAccepted: number;
  avgScore: number;
  clepPolicies: CLEPExamPolicy[];
}

export interface UserExamScore {
  exam: string;
  score: number | null;
}

export interface UniversityFilters {
  state?: string;
  minScore?: number;
  minCredits?: number;
  examNames?: string[];
  minExamsAccepted?: number;
  userExamScores?: UserExamScore[];
}

export interface ExamStatistics {
  examName: string;
  universitiesAccepting: number;
  averageMinimumScore: number;
  averageCreditsAwarded: number;
  minScore: number;
  maxScore: number;
}

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== '' && key !== '');
};

// Cache for Supabase queries
let universitiesCache: University[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Transform Supabase rows to University interface
function transformSupabaseData(uniRow: UniversityRow, policies: CLEPExamPolicyRow[]): University {
  const clepPolicies: CLEPExamPolicy[] = policies.map(p => ({
    examName: p.exam_name,
    minimumScore: p.minimum_score,
    creditsAwarded: p.credits_awarded,
    classEquivalent: p.course_equivalent,
  }));

  // Calculate statistics
  const acceptedPolicies = policies.filter(p => p.minimum_score !== null && p.minimum_score > 0);
  const examsAccepted = acceptedPolicies.length;
  const avgScore = examsAccepted > 0
    ? Math.round(acceptedPolicies.reduce((sum, p) => sum + (p.minimum_score || 0), 0) / examsAccepted)
    : 0;

  return {
    id: uniRow.di_code, // Use DI code as ID for compatibility
    name: uniRow.name,
    city: uniRow.city,
    state: uniRow.state,
    diCode: uniRow.di_code,
    zip: uniRow.zip || '',
    enrollment: uniRow.enrollment,
    url: uniRow.url || '',
    maxCredits: uniRow.max_credits,
    transcriptionFee: uniRow.transcription_fee,
    scoreValidityYears: uniRow.score_validity_years,
    canUseForFailedCourses: uniRow.can_use_for_failed_courses,
    canEnrolledStudentsUseCLEP: uniRow.can_enrolled_students_use_clep,
    mseaOrgId: uniRow.msea_org_id || '',
    examsAccepted,
    avgScore,
    clepPolicies,
  };
}

// Load from Supabase
async function loadFromSupabase(): Promise<University[]> {
  try {
    // Fetch universities
    const { data: universities, error: uniError } = await supabase
      .from('universities')
      .select('*')
      .order('name');

    if (uniError) throw uniError;
    if (!universities || universities.length === 0) {
      console.warn('[Supabase] No universities found, falling back to JSON');
      return [];
    }

    // Fetch all policies
    const { data: policies, error: policyError } = await supabase
      .from('clep_exam_policies')
      .select('*');

    if (policyError) throw policyError;

    // Group policies by university_id
    const policiesByUni = new Map<string, CLEPExamPolicyRow[]>();
    (policies || []).forEach(policy => {
      if (!policiesByUni.has(policy.university_id)) {
        policiesByUni.set(policy.university_id, []);
      }
      policiesByUni.get(policy.university_id)!.push(policy);
    });

    // Transform to University objects
    const result = universities.map(uni => {
      const uniPolicies = policiesByUni.get(uni.id) || [];
      return transformSupabaseData(uni, uniPolicies);
    });

    return result;
  } catch (error) {
    console.error('[Supabase] Error loading data:', error);
    return [];
  }
}

// Fallback: Load from JSON (for development/fallback)
function loadFromJSON(): University[] {
  // This is a simplified version - you can keep the full JSON parsing logic if needed
  // For now, return empty array and let the app handle it
  console.warn('[Database] JSON fallback not fully implemented. Please set up Supabase.');
  return [];
}

// Main function - tries Supabase first, falls back to JSON
export async function getAllUniversities(): Promise<University[]> {
  // Check cache first
  const now = Date.now();
  if (universitiesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return universitiesCache;
  }

  if (isSupabaseConfigured()) {
    const supabaseData = await loadFromSupabase();
    if (supabaseData.length > 0) {
      universitiesCache = supabaseData;
      cacheTimestamp = now;
      return supabaseData;
    }
  }

  // Fallback to JSON
  console.log('[Database] Using JSON fallback (Supabase not configured or empty)');
  const jsonData = loadFromJSON();
  universitiesCache = jsonData;
  cacheTimestamp = now;
  return jsonData;
}

// Get all available exam names
export function getAllExamNames(): string[] {
  return [
    "American Government",
    "American Literature",
    "Analyzing and Interpreting Literature",
    "Biology",
    "Calculus",
    "Chemistry",
    "College Algebra",
    "College Composition",
    "College Composition Modular",
    "College Mathematics",
    "English Literature",
    "Financial Accounting",
    "French Language Level I",
    "French Language Level II",
    "German Language Level I",
    "German Language Level II",
    "History of the United States I",
    "History of the United States II",
    "Human Growth and Development",
    "Humanities",
    "Information Systems",
    "Introduction to Educational Psychology",
    "Introductory Business Law",
    "Introductory Psychology",
    "Introductory Sociology",
    "Natural Sciences",
    "Precalculus",
    "Principles of Macroeconomics",
    "Principles of Management",
    "Principles of Marketing",
    "Principles of Microeconomics",
    "Social Sciences and History",
    "Spanish Language Level I",
    "Spanish Language Level II",
    "Spanish With Writing Level I",
    "Spanish With Writing Level II",
    "Western Civilization I",
    "Western Civilization II"
  ];
}

// Get a single university by ID
export async function getUniversityById(id: number): Promise<University | undefined> {
  const universities = await getAllUniversities();
  return universities.find(u => u.id === id);
}

// Get a single university by DI code
export async function getUniversityByDiCode(diCode: number | string): Promise<University | undefined> {
  const universities = await getAllUniversities();
  const code = typeof diCode === 'string' ? parseInt(diCode) : diCode;
  return universities.find(u => u.diCode === code);
}

// Search universities by name
export async function searchUniversitiesByName(query: string): Promise<University[]> {
  const universities = await getAllUniversities();
  const lowerQuery = query.toLowerCase();
  return universities.filter(u =>
    u.name.toLowerCase().includes(lowerQuery) ||
    u.city.toLowerCase().includes(lowerQuery) ||
    u.state.toLowerCase().includes(lowerQuery)
  );
}

// Filter universities
export async function filterUniversities(filters: UniversityFilters): Promise<University[]> {
  let universities = await getAllUniversities();

  // Filter by state
  if (filters.state) {
    universities = universities.filter(u => u.state === filters.state);
  }

  // Filter by minimum score
  if (filters.minScore !== undefined) {
    universities = universities.filter(u => {
      if (u.examsAccepted === 0 || u.avgScore === 0) {
        return true;
      }
      return u.avgScore >= filters.minScore!;
    });
  }

  // Filter by minimum exams accepted
  if (filters.minExamsAccepted !== undefined) {
    universities = universities.filter(u => u.examsAccepted >= filters.minExamsAccepted!);
  }

  // Filter by specific exams and user scores
  if (filters.examNames && filters.examNames.length > 0) {
    universities = universities.filter(u => {
      const acceptsAnyExam = filters.examNames!.some(examName => {
        const policy = u.clepPolicies.find(p => p.examName === examName);
        return policy && policy.minimumScore !== null && policy.minimumScore > 0;
      });
      
      if (!acceptsAnyExam) {
        return false;
      }
      
      if (filters.userExamScores && filters.userExamScores.length > 0) {
        const examsWithScores = filters.userExamScores.filter(e => e.score !== null);
        
        if (examsWithScores.length === 0) {
          return true;
        }
        
        const allScoresMeetRequirements = examsWithScores.every(userExam => {
          if (!filters.examNames!.includes(userExam.exam)) {
            return true;
          }
          
          const policy = u.clepPolicies.find(p => p.examName === userExam.exam);
          
          if (!policy || policy.minimumScore === null || policy.minimumScore === 0) {
            return false;
          }
          
          return userExam.score! >= policy.minimumScore;
        });
        
        return allScoresMeetRequirements;
      } else {
        return true;
      }
    });
  }

  // Filter by minimum credits
  if (filters.minCredits !== undefined) {
    universities = universities.filter(u => {
      if (u.examsAccepted === 0) {
        return true;
      }
      return u.clepPolicies.some(policy =>
        policy.creditsAwarded !== null && policy.creditsAwarded > 0 && policy.creditsAwarded >= filters.minCredits!
      );
    });
  }

  return universities;
}

// Get CLEP policy for a specific university and exam
export async function getCLEPPolicy(universityId: number, examName: string): Promise<CLEPExamPolicy | null> {
  const university = await getUniversityById(universityId);
  if (!university) return null;

  return university.clepPolicies.find(p => p.examName === examName) || null;
}

// Get all universities that accept a specific exam
export async function getUniversitiesByExam(examName: string): Promise<University[]> {
  const universities = await getAllUniversities();
  return universities.filter(u => {
    const policy = u.clepPolicies.find(p => p.examName === examName);
    return policy && policy.minimumScore !== null;
  });
}

// Get exam statistics across all universities
export async function getExamStatistics(examName: string): Promise<ExamStatistics | null> {
  const universities = await getAllUniversities();
  const acceptingUniversities = universities.filter(u => {
    const policy = u.clepPolicies.find(p => p.examName === examName);
    return policy && policy.minimumScore !== null;
  });

  if (acceptingUniversities.length === 0) {
    return null;
  }

  const scores: number[] = [];
  const credits: number[] = [];

  acceptingUniversities.forEach(u => {
    const policy = u.clepPolicies.find(p => p.examName === examName);
    if (policy && policy.minimumScore !== null) {
      scores.push(policy.minimumScore);
      if (policy.creditsAwarded !== null) {
        credits.push(policy.creditsAwarded);
      }
    }
  });

  const averageMinimumScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const averageCreditsAwarded = credits.length > 0
    ? Math.round((credits.reduce((a, b) => a + b, 0) / credits.length) * 10) / 10
    : 0;

  return {
    examName,
    universitiesAccepting: acceptingUniversities.length,
    averageMinimumScore,
    averageCreditsAwarded,
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores)
  };
}

// Clear cache
export function clearCache(): void {
  universitiesCache = null;
  cacheTimestamp = 0;
}
