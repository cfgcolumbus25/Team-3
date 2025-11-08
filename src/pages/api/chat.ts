import Anthropic from "@anthropic-ai/sdk";
import { 
  getAllUniversities, 
  filterUniversities, 
  searchUniversitiesByName,
  getUniversitiesByExam,
  type UniversityFilters 
} from "@/lib/universityDatabase";

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

// Build context from university database based on user query
async function buildContextFromDatabase(userMessage: string): Promise<string> {
  const lowerMessage = userMessage.toLowerCase();
  const universities = await getAllUniversities();
  
  let context = `You are a helpful assistant for CLEP (College Level Examination Program) exam credit acceptance. You have access to data about ${universities.length} universities and their CLEP acceptance policies.\n\n`;
  
  const contextParts: string[] = [];
  
  // Check for state mentions
  const stateMap: { [key: string]: string } = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
    "wisconsin": "WI", "wyoming": "WY"
  };
  
  let mentionedState: string | undefined;
  for (const [stateName, abbr] of Object.entries(stateMap)) {
    if (lowerMessage.includes(stateName)) {
      mentionedState = abbr;
      break;
    }
  }
  
  // Check for exam mentions
  const examKeywords: { [key: string]: string[] } = {
    "biology": ["biology"],
    "chemistry": ["chemistry"],
    "calculus": ["calculus"],
    "algebra": ["algebra", "college algebra"],
    "psychology": ["psychology", "introductory psychology"],
    "economics": ["economics", "macro", "micro"],
    "history": ["history", "united states", "western civilization"],
    "literature": ["literature", "english", "american literature"],
    "composition": ["composition", "writing", "college composition"],
    "sociology": ["sociology"],
    "government": ["government", "american government"],
    "spanish": ["spanish"],
    "french": ["french"],
    "german": ["german"]
  };
  
  const mentionedExams: string[] = [];
  for (const [exam, keywords] of Object.entries(examKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      mentionedExams.push(exam);
    }
  }
  
  // Filter universities based on query
  let relevantUniversities = universities;
  
  if (mentionedState) {
    relevantUniversities = await filterUniversities({ state: mentionedState });
    const stateName = Object.keys(stateMap).find(k => stateMap[k] === mentionedState);
    contextParts.push(`User is asking about ${stateName?.toUpperCase() || mentionedState}. Found ${relevantUniversities.length} universities in ${mentionedState}.`);
  }
  
  if (mentionedExams.length > 0) {
    const allExams = universities[0]?.clepPolicies.map(p => p.examName) || [];
    const examNames = allExams.filter(examName => 
      mentionedExams.some(exam => examName.toLowerCase().includes(exam))
    );
    
    if (examNames.length > 0) {
      relevantUniversities = await filterUniversities({ examNames });
      contextParts.push(`User is asking about ${examNames.join(", ")}. Found ${relevantUniversities.length} universities that accept these exams.`);
    }
  }
  
  // Check for score mentions
  const scoreMatch = userMessage.match(/\b(\d{2,3})\b/);
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]);
    if (score >= 20 && score <= 80) {
      contextParts.push(`User mentioned a CLEP score of ${score}.`);
      relevantUniversities = await filterUniversities({ minScore: score });
    }
  }
  
  // Build detailed context from relevant universities
  if (relevantUniversities.length > 0 && relevantUniversities.length <= 10) {
    contextParts.push("\nRelevant Universities:\n");
    relevantUniversities.slice(0, 10).forEach(uni => {
      contextParts.push(
        `- ${uni.name} (${uni.city}, ${uni.state}): ` +
        `Accepts ${uni.examsAccepted} CLEP exams, ` +
        `Average minimum score: ${uni.avgScore || "N/A"}, ` +
        `Max credits: ${uni.maxCredits}, ` +
        `Score validity: ${uni.scoreValidityYears} years`
      );
    });
  } else if (relevantUniversities.length > 10) {
    contextParts.push(`\nFound ${relevantUniversities.length} relevant universities. Here are the top 10:`);
    relevantUniversities.slice(0, 10).forEach(uni => {
      contextParts.push(
        `- ${uni.name} (${uni.city}, ${uni.state}): ` +
        `Accepts ${uni.examsAccepted} exams, avg score: ${uni.avgScore || "N/A"}`
      );
    });
  }
  
  // Add general statistics
  const totalUniversities = universities.length;
  const avgExamsAccepted = Math.round(
    universities.reduce((sum, u) => sum + u.examsAccepted, 0) / totalUniversities
  );
  const universitiesWithScores = universities.filter(u => u.avgScore > 0);
  const avgMinScore = universitiesWithScores.length > 0
    ? Math.round(universitiesWithScores.reduce((sum, u) => sum + u.avgScore, 0) / universitiesWithScores.length)
    : 0;
  
  contextParts.push(
    `\nGeneral Statistics:`,
    `- Total universities in database: ${totalUniversities}`,
    `- Average exams accepted per university: ${avgExamsAccepted}`,
    `- Average minimum CLEP score required: ${avgMinScore}`
  );
  
  context += contextParts.join("\n");
  return context;
}

// This will be called from the frontend
export async function handleChatRequest(message: string): Promise<string> {
  try {
    if (!message || typeof message !== "string") {
      throw new Error("Message is required");
    }
    
    // Check if API key is available
    if (!apiKey) {
      console.error("Claude API key is not configured");
      return "I'm sorry, but the AI service is not properly configured. Please contact support.";
    }
    
    // Build context from university database
    const context = await buildContextFromDatabase(message);
    
    // Create prompt with context
    const prompt = `You are a helpful assistant for CLEP (College Level Examination Program) exam credit acceptance. You help students find universities that accept CLEP credits and answer questions about CLEP policies.

${context}

User Question: ${message}

IMPORTANT FORMATTING RULES:
- Do NOT use markdown formatting (no **, ##, #, *, etc.)
- Use plain text only
- Use line breaks for readability
- Use simple bullet points with dashes (-) if needed
- Be conversational and helpful
- Provide accurate information based on the university data above

Please provide a helpful, accurate answer based on the university data above. If the user is asking about specific universities, exams, or states, use the relevant information provided.`;

    // Call Claude API - using claude-sonnet-4-5-20250929
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    if (!completion.content || completion.content.length === 0) {
      throw new Error("No response from Claude API");
    }
    
    const reply = completion.content[0].type === "text" 
      ? completion.content[0].text 
      : "I apologize, but I couldn't generate a proper response.";
    
    return reply;
    
  } catch (error: any) {
    console.error("Chat API error:", error);
    // Return a user-friendly error message
    if (error.message?.includes("API key")) {
      return "I'm sorry, but there's an issue with the API configuration. Please check the console for details.";
    }
    if (error.message?.includes("rate limit") || error.message?.includes("429")) {
      return "I'm receiving too many requests right now. Please try again in a moment.";
    }
    return `I encountered an error: ${error.message || "Unknown error"}. Please try again.`;
  }
}
