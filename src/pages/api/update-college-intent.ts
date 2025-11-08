import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { message } = req.body;

  const extractionPrompt = `
You extract update commands from the user message and return ONLY JSON.

Output must be an ARRAY of objects:
[
  {"course":"", "field":"", "value": ""},
  {"course":"", "field":"", "value": ""}
]

Example input:
"Set CMSC131 cut credits to 3 and change CMSC132 instructor to Dr. Smith"
Output:
[
  {"course":"CMSC131","field":"cut_credits","value":3},
  {"course":"CMSC132","field":"instructor","value":"Dr. Smith"}
]

Return ONLY valid JSON. No natural language.

User: ${message}
JSON:
  `;

  const result = await anthropic.messages.create({
    model: "claude-3.5-sonnet",
    messages: [{ role: "user", content: extractionPrompt }],
    max_tokens: 300
  });

  let parsed;
  try {
    parsed = JSON.parse(result.content[0].text);
  } catch {
    return res.json({ reply: "I couldn't understand the update request." });
  }

  // Build confirmation text
  let summary = "You want to apply these updates:\n";
  parsed.forEach((a: any) => {
    summary += `• ${a.course}: ${a.field} = ${a.value}\n`;
  });
  summary += "Confirm? (yes/no)";

  return res.json({
    reply: summary,
    actions: parsed
  });
}
