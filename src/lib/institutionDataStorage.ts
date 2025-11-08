// Utility to manage institution-specific CLEP exam data in localStorage
// Since we can't write to JSON files from the browser, we use localStorage

export interface InstitutionExamData {
  examName: string;
  minScore: string | number;
  credits: string | number;
  courseCode: string;
  lastUpdated: string;
  category?: string;
}

const STORAGE_PREFIX = "institution_clep_data_";

/**
 * Get all CLEP exam data for an institution
 */
export function getInstitutionExamData(institutionId: number): InstitutionExamData[] {
  try {
    const key = `${STORAGE_PREFIX}${institutionId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading institution exam data:", error);
  }
  return [];
}

/**
 * Save CLEP exam data for an institution
 */
export function saveInstitutionExamData(
  institutionId: number,
  examData: InstitutionExamData[]
): void {
  try {
    const key = `${STORAGE_PREFIX}${institutionId}`;
    localStorage.setItem(key, JSON.stringify(examData));
  } catch (error) {
    console.error("Error saving institution exam data:", error);
    throw new Error("Failed to save exam data");
  }
}

/**
 * Update a specific exam's data for an institution
 */
export function updateInstitutionExam(
  institutionId: number,
  examName: string,
  updates: Partial<InstitutionExamData>
): boolean {
  try {
    const examData = getInstitutionExamData(institutionId);
    const examIndex = examData.findIndex(
      (e) => e.examName.toLowerCase() === examName.toLowerCase()
    );

    if (examIndex === -1) {
      // Exam doesn't exist, create it
      const newExam: InstitutionExamData = {
        examName,
        minScore: updates.minScore ?? "",
        credits: updates.credits ?? "",
        courseCode: updates.courseCode ?? "",
        lastUpdated: new Date().toISOString().split("T")[0],
        category: updates.category,
      };
      examData.push(newExam);
    } else {
      // Update existing exam
      examData[examIndex] = {
        ...examData[examIndex],
        ...updates,
        lastUpdated: new Date().toISOString().split("T")[0],
      };
    }

    saveInstitutionExamData(institutionId, examData);
    return true;
  } catch (error) {
    console.error("Error updating institution exam:", error);
    return false;
  }
}

/**
 * Initialize default exam data for an institution if none exists
 */
export function initializeDefaultExamData(institutionId: number): void {
  const existing = getInstitutionExamData(institutionId);
  if (existing.length > 0) {
    return; // Already initialized
  }

  const defaultExams: InstitutionExamData[] = [
    {
      examName: "American Government",
      minScore: "",
      credits: "",
      courseCode: "",
      lastUpdated: "Never",
      category: "Social Sciences",
    },
    {
      examName: "Biology",
      minScore: "",
      credits: "",
      courseCode: "",
      lastUpdated: "Never",
      category: "Natural Sciences",
    },
    {
      examName: "Chemistry",
      minScore: "",
      credits: "",
      courseCode: "",
      lastUpdated: "Never",
      category: "Natural Sciences",
    },
    {
      examName: "College Algebra",
      minScore: "",
      credits: "",
      courseCode: "",
      lastUpdated: "Never",
      category: "Mathematics",
    },
    {
      examName: "English Composition",
      minScore: "",
      credits: "",
      courseCode: "",
      lastUpdated: "Never",
      category: "Composition",
    },
    {
      examName: "History of US I",
      minScore: "",
      credits: "",
      courseCode: "",
      lastUpdated: "Never",
      category: "History",
    },
  ];

  saveInstitutionExamData(institutionId, defaultExams);
}

/**
 * Get a single exam's data
 */
export function getInstitutionExam(
  institutionId: number,
  examName: string
): InstitutionExamData | null {
  const examData = getInstitutionExamData(institutionId);
  return (
    examData.find(
      (e) => e.examName.toLowerCase() === examName.toLowerCase()
    ) || null
  );
}

