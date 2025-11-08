import Anthropic from "@anthropic-ai/sdk";

// Anthropic client with API key from environment variable
const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
if (!apiKey) {
  console.error("VITE_CLAUDE_API_KEY is not set in environment variables");
}

// WARNING: Using dangerouslyAllowBrowser exposes your API key in the client bundle.
// This is acceptable for development but should be moved to a backend server for production.
const anthropic = new Anthropic({
  apiKey: apiKey || "",
  dangerouslyAllowBrowser: true
});

export interface UpdateAction {
  exam: string;
  field: "minScore" | "credits" | "courseCode";
  value: string | number;
}

export interface UpdateIntentResponse {
  reply: string;
  actions?: UpdateAction[];
}

// This will be called from the frontend
export async function handleUpdateIntent(message: string): Promise<UpdateIntentResponse> {
  try {
    if (!message || typeof message !== "string") {
      throw new Error("Message is required");
    }
    
    // Check if API key is available
    if (!apiKey) {
      console.error("Claude API key is not configured");
      return { reply: "I'm sorry, but the AI service is not properly configured. Please contact support." };
    }

    const extractionPrompt = `
You extract update commands from the user message about CLEP exam data and return ONLY JSON.

Output must be an ARRAY of objects:
[
  {"exam":"", "field":"", "value": ""},
  {"exam":"", "field":"", "value": ""}
]

Field must be one of: "minScore", "credits", "courseCode"
- "minScore" for minimum score (value should be a number like 50, 55, etc.)
- "credits" for credits awarded (value should be a number like 3, 4, etc.)
- "courseCode" for course equivalent (value should be a string like "BIO 101")

Example inputs:
"Set Biology minimum score to 55"
Output: [{"exam":"Biology","field":"minScore","value":55}]

"Change Chemistry credits to 4 and set the course code to CHEM 101"
Output: [{"exam":"Chemistry","field":"credits","value":4},{"exam":"Chemistry","field":"courseCode","value":"CHEM 101"}]

"Update Biology to score 50, credits 3, and course BIO 101"
Output: [{"exam":"Biology","field":"minScore","value":50},{"exam":"Biology","field":"credits","value":3},{"exam":"Biology","field":"courseCode","value":"BIO 101"}]

Common CLEP exam names: Biology, Chemistry, Calculus, College Algebra, English Composition, American Government, History of US I, History of US II, Psychology, Economics, etc.

Return ONLY valid JSON. No natural language.

User: ${message}
JSON:
    `;

    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      messages: [{ role: "user", content: extractionPrompt }],
      max_tokens: 500
    });

    let parsed: UpdateAction[];
    try {
      const responseText = result.content[0].type === "text" 
        ? result.content[0].text 
        : "";
      
      // Try to extract JSON from the response (Claude sometimes adds extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(responseText);
      }
    } catch (error) {
      console.error("Failed to parse Claude response:", error);
      return { reply: "I couldn't understand the update request. Please try rephrasing it, for example: 'Set Biology minimum score to 55' or 'Change Chemistry credits to 4'." };
    }

    // Validate the parsed actions
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { reply: "I couldn't find any update commands in your message. Please specify which exam and what you'd like to change." };
    }

    // Validate each action
    const validActions: UpdateAction[] = [];
    for (const action of parsed) {
      if (action.exam && action.field && action.value !== undefined) {
        if (["minScore", "credits", "courseCode"].includes(action.field)) {
          validActions.push(action);
        }
      }
    }

    if (validActions.length === 0) {
      return { reply: "I couldn't extract valid update commands. Please specify the exam name, field (minScore, credits, or courseCode), and value." };
    }

    // Build confirmation text
    let summary = "You want to apply these updates:\n\n";
    validActions.forEach((a: UpdateAction) => {
      const fieldLabel = a.field === "minScore" ? "Minimum Score" 
        : a.field === "credits" ? "Credits" 
        : "Course Code";
      summary += `• ${a.exam}: ${fieldLabel} = ${a.value}\n`;
    });
    summary += "\nConfirm? (yes/no)";

    return {
      reply: summary,
      actions: validActions
    };
    
  } catch (error: any) {
    console.error("Update intent API error:", error);
    if (error.message?.includes("API key")) {
      return { reply: "I'm sorry, but there's an issue with the API configuration. Please check the console for details." };
    }
    if (error.message?.includes("rate limit") || error.message?.includes("429")) {
      return { reply: "I'm receiving too many requests right now. Please try again in a moment." };
    }
    return { reply: `I encountered an error: ${error.message || "Unknown error"}. Please try again.` };
  }
}
