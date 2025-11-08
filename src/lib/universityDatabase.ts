// Local database implementation using university_data.json
// This provides a database-like interface without requiring Supabase

import universityData from '../../university_data.json';

// Type definitions based on the JSON structure
// Support both formats:
// 1. Flat format: { "School Name": "...", "City": "...", ... }
// 2. Nested format: { "school_name": "...", "city": "...", "clep_exams": {...} }
export interface UniversityDataFlat {
  "School Name": string;
  "City": string;
  "State": string;
  "DI Code": number;
  "Zip": string;
  "Enrollment": string;
  "Max Credits": string;
  "Transcription Fee": string;
  "Can Use For Failed Courses": number;
  "Can Enrolled Students Use CLEP": number;
  "Score Validity (years)": number;
  "url": string;
  "MSEA Org ID": string;
  [key: string]: any; // For exam fields
}

export interface UniversityDataNested {
  school_name: string;
  city: string;
  state: string;
  di_code: string | number;
  zip?: string;
  enrollment?: string | number;
  max_credits?: string | number;
  transcription_fee?: string | number;
  can_use_for_failed_courses?: number;
  can_enrolled_students_use_clep?: number;
  score_validity_years?: number;
  url?: string;
  msea_org_id?: string;
  notes?: string;
  clep_exams: {
    [examName: string]: {
      minimum_score: number;
      credits_awarded: number;
      course_equivalent: string | number;
    };
  };
}

export type UniversityData = UniversityDataFlat | UniversityDataNested;

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
  examsAccepted: number; // Count of accepted exams
  avgScore: number; // Average minimum score across all accepted exams
  clepPolicies: CLEPExamPolicy[];
}

// Extract all unique exam names from the JSON structure
// All 38 CLEP exams in alphabetical order (matching JSON structure)
const EXAM_FIELDS = [
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

// Check if data is in nested format
function isNestedFormat(data: UniversityData): data is UniversityDataNested {
  return 'school_name' in data && 'clep_exams' in data;
}

// Transform raw JSON data to University interface
function transformUniversityData(raw: UniversityData, id: number): University {
  const clepPolicies: CLEPExamPolicy[] = [];
  let totalScore = 0;
  let acceptedCount = 0;

  // Handle nested format (new structure with clep_exams object)
  if (isNestedFormat(raw)) {
    EXAM_FIELDS.forEach(examName => {
      const examData = raw.clep_exams[examName];
      if (!examData) {
        clepPolicies.push({
          examName,
          minimumScore: null,
          creditsAwarded: null,
          classEquivalent: null
        });
        return;
      }

      const minimumScore = examData.minimum_score > 0 ? examData.minimum_score : null;
      const creditsAwarded = examData.credits_awarded > 0 ? examData.credits_awarded : null;
      let classEquivalent: string | null = null;
      if (examData.course_equivalent && examData.course_equivalent !== 0 && examData.course_equivalent !== "0") {
        classEquivalent = typeof examData.course_equivalent === 'string' 
          ? examData.course_equivalent 
          : examData.course_equivalent.toString();
      }

      if (minimumScore !== null && minimumScore > 0) {
        totalScore += minimumScore;
        acceptedCount++;
      }

      clepPolicies.push({
        examName,
        minimumScore,
        creditsAwarded,
        classEquivalent
      });
    });

    // Calculate average score
    const avgScore = acceptedCount > 0 ? Math.round(totalScore / acceptedCount) : 0;

    // Parse numeric fields from nested format
    const enrollment = typeof raw.enrollment === 'string' 
      ? parseInt(raw.enrollment) || 0 
      : (raw.enrollment || 0);
    const maxCredits = typeof raw.max_credits === 'string'
      ? parseInt(raw.max_credits) || 0
      : (raw.max_credits || 0);
    const transcriptionFee = typeof raw.transcription_fee === 'string'
      ? parseFloat(raw.transcription_fee) || 0
      : (raw.transcription_fee || 0);
    const scoreValidityYears = raw.score_validity_years || 0;
    const diCode = typeof raw.di_code === 'string' ? parseInt(raw.di_code) || 0 : raw.di_code;

    return {
      id,
      name: raw.school_name,
      city: raw.city,
      state: raw.state,
      diCode,
      zip: raw.zip || "",
      enrollment,
      url: raw.url || "",
      maxCredits,
      transcriptionFee,
      scoreValidityYears,
      canUseForFailedCourses: raw.can_use_for_failed_courses === 1,
      canEnrolledStudentsUseCLEP: raw.can_enrolled_students_use_clep === 1,
      mseaOrgId: raw.msea_org_id || "",
      examsAccepted: acceptedCount,
      avgScore,
      clepPolicies
    };
  }

  // Handle flat format (old structure)
  const rawFlat = raw as UniversityDataFlat;
  EXAM_FIELDS.forEach(examName => {
    const scoreField = examName;
    const creditsField = `${examName}_credit_awarded`;
    const classField = `${examName}_class_equivalent`;

    const score = rawFlat[scoreField];
    const credits = rawFlat[creditsField];
    const classEquivalent = rawFlat[classField];

    // Parse score (can be string, number, or null)
    // Note: CLEP scores range from 20-80, so 0 means "not accepted"
    let minimumScore: number | null = null;
    if (score !== null && score !== undefined && score !== "" && score !== 0 && score !== "0") {
      if (typeof score === "string") {
        // Handle ranges like "50/63" or "50\/63" - take the first value (minimum)
        const cleanScore = score.replace(/\\/g, ""); // Remove escaped slashes
        const numValue = parseFloat(cleanScore.split("/")[0].trim());
        if (!isNaN(numValue) && numValue > 0) {
          minimumScore = numValue;
        }
      } else if (typeof score === "number" && score > 0) {
        minimumScore = score;
      }
    }

    // Parse credits (can be string, number, or null)
    // 0 means "not accepted" or "no credits awarded"
    let creditsAwarded: number | null = null;
    if (credits !== null && credits !== undefined && credits !== "" && credits !== 0 && credits !== "0") {
      if (typeof credits === "string") {
        // Handle ranges like "3/4" or "4/8" - take the first value (minimum)
        const cleanCredits = credits.replace(/\\/g, ""); // Remove escaped slashes
        const numValue = parseFloat(cleanCredits.split("/")[0].trim());
        if (!isNaN(numValue) && numValue > 0) {
          creditsAwarded = numValue;
        }
      } else if (typeof credits === "number" && credits > 0) {
        creditsAwarded = credits;
      }
    }

    // If exam is accepted (has a valid score > 0), count it
    if (minimumScore !== null && minimumScore > 0) {
      totalScore += minimumScore;
      acceptedCount++;
    }

    // Parse class equivalent (can be string, number 0, or null)
    let classEq: string | null = null;
    if (classEquivalent !== null && classEquivalent !== undefined && classEquivalent !== "" && classEquivalent !== 0 && classEquivalent !== "0") {
      if (typeof classEquivalent === "string") {
        classEq = classEquivalent;
      } else if (typeof classEquivalent === "number") {
        // If it's a number and not 0, convert to string
        classEq = classEquivalent.toString();
      }
    }

    clepPolicies.push({
      examName,
      minimumScore,
      creditsAwarded,
      classEquivalent: classEq
    });
  });

  // Calculate average score
  const avgScore = acceptedCount > 0 ? Math.round(totalScore / acceptedCount) : 0;

  // Parse numeric fields from flat format
  const enrollment = parseInt(rawFlat.Enrollment) || 0;
  const maxCredits = parseInt(rawFlat["Max Credits"]) || 0;
  const transcriptionFee = parseFloat(rawFlat["Transcription Fee"]) || 0;
  const scoreValidityYears = rawFlat["Score Validity (years)"] || 0;

  return {
    id,
    name: rawFlat["School Name"],
    city: rawFlat.City,
    state: rawFlat.State,
    diCode: rawFlat["DI Code"],
    zip: rawFlat.Zip || "",
    enrollment,
    url: rawFlat.url || "",
    maxCredits,
    transcriptionFee,
    scoreValidityYears,
    canUseForFailedCourses: rawFlat["Can Use For Failed Courses"] === 1,
    canEnrolledStudentsUseCLEP: rawFlat["Can Enrolled Students Use CLEP"] === 1,
    mseaOrgId: rawFlat["MSEA Org ID"] || "",
    examsAccepted: acceptedCount,
    avgScore,
    clepPolicies
  };
}

// Load and transform all universities
let universitiesCache: University[] | null = null;

export function getAllUniversities(): University[] {
  if (universitiesCache) {
    return universitiesCache;
  }

  // Handle both formats: direct array or object with schools array
  let schoolsArray: UniversityData[];
  
  if (Array.isArray(universityData)) {
    // Direct array format
    schoolsArray = universityData;
    console.log(`[UniversityDatabase] Loaded ${schoolsArray.length} schools from direct array format`);
  } else if (typeof universityData === 'object' && universityData !== null && 'schools' in universityData) {
    // Object with schools array
    schoolsArray = (universityData as { schools: UniversityData[] }).schools;
    console.log(`[UniversityDatabase] Loaded ${schoolsArray.length} schools from nested format (schools array)`);
  } else {
    // Fallback: try to use as array
    schoolsArray = [universityData as UniversityData];
    console.log(`[UniversityDatabase] Loaded 1 school from fallback format`);
  }

  universitiesCache = schoolsArray.map((raw, index) =>
    transformUniversityData(raw, index + 1)
  );

  console.log(`[UniversityDatabase] Successfully transformed ${universitiesCache.length} universities`);
  return universitiesCache;
}

// Clear cache - useful for development when JSON file changes
export function clearCache(): void {
  universitiesCache = null;
}

// Get all available exam names
export function getAllExamNames(): string[] {
  return EXAM_FIELDS;
}

// Get a single university by ID
export function getUniversityById(id: number): University | undefined {
  const universities = getAllUniversities();
  return universities.find(u => u.id === id);
}

// Search universities by name
export function searchUniversitiesByName(query: string): University[] {
  const universities = getAllUniversities();
  const lowerQuery = query.toLowerCase();
  return universities.filter(u =>
    u.name.toLowerCase().includes(lowerQuery) ||
    u.city.toLowerCase().includes(lowerQuery) ||
    u.state.toLowerCase().includes(lowerQuery)
  );
}

// Filter universities
// UserExamScore interface for filtering - matches the one in LearnerPortal
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

export function filterUniversities(filters: UniversityFilters): University[] {
  let universities = getAllUniversities();

  // Filter by state
  if (filters.state) {
    universities = universities.filter(u => u.state === filters.state);
  }

  // Filter by minimum score
  // Only apply if university has accepted exams (avgScore > 0)
  // Universities with 0 exams accepted (avgScore = 0) should still be shown
  if (filters.minScore !== undefined) {
    universities = universities.filter(u => {
      // If university has no accepted exams, don't filter it out by score
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
      // First, check if university accepts at least one of the selected exams
      const acceptsAnyExam = filters.examNames!.some(examName => {
        const policy = u.clepPolicies.find(p => p.examName === examName);
        return policy && policy.minimumScore !== null && policy.minimumScore > 0;
      });
      
      if (!acceptsAnyExam) {
        return false; // University doesn't accept any of the selected exams
      }
      
      // If user has entered scores, check if their scores meet the university's requirements
      if (filters.userExamScores && filters.userExamScores.length > 0) {
        // Get exams that user has entered scores for
        const examsWithScores = filters.userExamScores.filter(e => e.score !== null);
        
        if (examsWithScores.length === 0) {
          // No scores entered, just show universities that accept the selected exams
          return true;
        }
        
        // Check if ALL entered scores meet the university's minimum requirements
        // OR if at least one entered score meets the requirement (more lenient)
        // Using "every" to require all scores meet requirements (stricter)
        // Using "some" would be more lenient - showing if any score meets requirement
        const allScoresMeetRequirements = examsWithScores.every(userExam => {
          // Only check exams that are in the selected exam names
          if (!filters.examNames!.includes(userExam.exam)) {
            return true; // Skip exams not in the selected list
          }
          
          const policy = u.clepPolicies.find(p => p.examName === userExam.exam);
          
          // If exam is not accepted by university, exclude it
          if (!policy || policy.minimumScore === null || policy.minimumScore === 0) {
            return false;
          }
          
          // Check if user's score meets the minimum requirement
          return userExam.score! >= policy.minimumScore;
        });
        
        return allScoresMeetRequirements;
      } else {
        // No scores entered, just check if university accepts at least one of the requested exams
        return true; // Already checked above
      }
    });
  }

  // Filter by minimum credits (check if any exam meets the requirement)
  // Universities with 0 exams accepted should still be shown
  if (filters.minCredits !== undefined) {
    universities = universities.filter(u => {
      // If university has no accepted exams, don't filter it out by credits
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
export function getCLEPPolicy(universityId: number, examName: string): CLEPExamPolicy | null {
  const university = getUniversityById(universityId);
  if (!university) return null;

  return university.clepPolicies.find(p => p.examName === examName) || null;
}

// Get all universities that accept a specific exam
export function getUniversitiesByExam(examName: string): University[] {
  const universities = getAllUniversities();
  return universities.filter(u => {
    const policy = u.clepPolicies.find(p => p.examName === examName);
    return policy && policy.minimumScore !== null;
  });
}

// Get exam statistics across all universities
export interface ExamStatistics {
  examName: string;
  universitiesAccepting: number;
  averageMinimumScore: number;
  averageCreditsAwarded: number;
  minScore: number;
  maxScore: number;
}

export function getExamStatistics(examName: string): ExamStatistics | null {
  const universities = getAllUniversities();
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

