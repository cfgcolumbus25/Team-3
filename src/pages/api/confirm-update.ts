import type { UpdateAction } from "./update-college-intent";
import {
  updateInstitutionExam,
  initializeDefaultExamData,
  getInstitutionExam,
} from "@/lib/institutionDataStorage";

export interface ConfirmUpdateResponse {
  reply: string;
  errors?: Array<{ exam: string; field: string; error: string }>;
}

// This will be called from the frontend
// Persists updates to localStorage for the institution
export async function handleConfirmUpdate(
  actions: UpdateAction[],
  institutionId: number
): Promise<ConfirmUpdateResponse> {
  try {
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return { reply: "No updates to apply." };
    }

    if (!institutionId) {
      return {
        reply: "Error: Institution ID is required. Please log in again.",
      };
    }

    // Initialize default data if needed
    initializeDefaultExamData(institutionId);

    const errors: Array<{ exam: string; field: string; error: string }> = [];
    const successfulUpdates: string[] = [];

    // Process each action
    for (const action of actions) {
      if (!action.exam || !action.field || action.value === undefined) {
        errors.push({
          exam: action.exam || "Unknown",
          field: action.field || "Unknown",
          error: "Invalid action data",
        });
        continue;
      }

      // Get current exam data
      const currentExam = getInstitutionExam(institutionId, action.exam);

      // Prepare update object
      const updates: Partial<{
        minScore: string | number;
        credits: string | number;
        courseCode: string;
      }> = {};

      // Map field names to storage format
      if (action.field === "minScore") {
        updates.minScore =
          typeof action.value === "number"
            ? action.value.toString()
            : action.value;
      } else if (action.field === "credits") {
        updates.credits =
          typeof action.value === "number"
            ? action.value.toString()
            : action.value;
      } else if (action.field === "courseCode") {
        updates.courseCode = String(action.value);
      }

      // Preserve existing category if updating
      if (currentExam?.category) {
        // Category is preserved automatically in updateInstitutionExam
      }

      // Update the exam
      const success = updateInstitutionExam(
        institutionId,
        action.exam,
        updates
      );

      if (success) {
        successfulUpdates.push(action.exam);
      } else {
        errors.push({
          exam: action.exam,
          field: action.field,
          error: "Failed to save update",
        });
      }
    }

    // Build response message
    if (errors.length > 0 && successfulUpdates.length === 0) {
      return {
        reply: `❌ Failed to apply updates. ${errors.length} error(s) occurred.`,
        errors,
      };
    }

    if (errors.length > 0) {
      const successCount = successfulUpdates.length;
      const errorCount = errors.length;
      const examNames = [...new Set(successfulUpdates)].join(", ");
      return {
        reply: `⚠️ Partially successful: ${successCount} update(s) applied to ${examNames}, but ${errorCount} update(s) failed.`,
        errors,
      };
    }

    // All successful
    const updateCount = actions.length;
    const examNames = [...new Set(successfulUpdates)].join(", ");

    return {
      reply: `✅ Successfully applied ${updateCount} update(s) to ${examNames}.\n\nYour changes have been saved to localStorage. You can view them in the Data Management page.`,
    };
  } catch (error: any) {
    console.error("Confirm update error:", error);
    return {
      reply: `I encountered an error while applying updates: ${
        error.message || "Unknown error"
      }. Please try again.`,
    };
  }
}