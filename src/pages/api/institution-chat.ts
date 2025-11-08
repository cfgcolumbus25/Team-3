// Helper function to handle informational queries for institution chatbot
// This handles questions that don't require data updates

export function handleInformationalQuery(message: string, institutionId: number): string {
  const lower = message.toLowerCase();
  
  // View all data
  if (lower.includes("view") && (lower.includes("all") || lower.includes("my") || lower.includes("data"))) {
    return `To view all your CLEP exam data, you can:\n\n1️⃣ Go to the Data Management page\n2️⃣ Use the table view to see all exams at once\n3️⃣ Filter by category or search for specific exams\n\nWould you like me to help you update any specific exam data?`;
  }
  
  // Bulk edit
  if (lower.includes("bulk") || (lower.includes("edit") && (lower.includes("multiple") || lower.includes("many")))) {
    return `To bulk edit your CLEP data:\n\n1️⃣ Go to Data Management page\n2️⃣ Select multiple exams using checkboxes\n3️⃣ Click 'Bulk Edit' button\n4️⃣ Apply changes to all selected exams at once\n\nOr you can tell me multiple updates in one message, like:\n"Set Biology and Chemistry minimum scores to 55"`;
  }
  
  // CLEP scoring explanation
  if (lower.includes("scor") || lower.includes("score") || lower.includes("scoring")) {
    return `Great question! Here's how CLEP scoring works:\n\n📊 Score Range: 20-80 points\n\n📈 Common Minimum Score Requirements:\n• 50 = Most lenient (~82% pass rate)\n• 55 = Moderate (~70% pass rate)\n• 60 = Selective (~55% pass rate)\n\n🎯 Industry Average: Most institutions require a score of 50-52\n\n💡 Tips:\n• Lower minimum scores = more students can earn credit\n• Higher minimum scores = more selective, ensures stronger preparation\n• Consider your institution's academic standards when setting minimums\n\nWould you like to update any of your minimum score requirements?`;
  }
  
  // General help
  if (lower.includes("help") || lower.includes("what can") || lower.includes("how can")) {
    return `I can help you with:\n\n✅ Updating exam scores and credits\n   Example: "Set Biology minimum score to 55"\n\n✅ Viewing your CLEP acceptance data\n   Example: "Show me my Biology data"\n\n✅ Bulk editing multiple exams\n   Example: "Set all science exams to score 50"\n\n✅ Understanding CLEP scoring\n   Example: "Explain CLEP scoring"\n\n✅ Finding specific exam information\n   Example: "What's my Chemistry policy?"\n\nWhat would you like to do?`;
  }
  
  // Default response for informational queries
  return `I can help you update your CLEP exam data. Try saying something like:\n\n• "Set Biology minimum score to 55"\n• "Change Chemistry credits to 4"\n• "Update Calculus course code to MATH 201"\n\nOr ask me about:\n• "View all my data"\n• "How do I bulk edit?"\n• "Explain CLEP scoring"`;
}

