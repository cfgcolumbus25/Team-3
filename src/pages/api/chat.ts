import express from "express";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

router.post("/chat", async (req, res) => {
  const { message } = req.body;

  // Create embedding using Claude
  const embedRes = await anthropic.embeddings.create({
    model: "claude-3.5-embed",
    input: message
  });

  const embedding = embedRes.data[0].embedding;

  // Query Supabase vector table
  const { data: matches, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 5
  });

  if (error) {
    console.error(error);
    return res.status(500).json({ error });
  }

  // Build context from matching docs
  const context = matches.map(m => m.content).join("\n\n");

  // RAG prompt
  const prompt = `
You are a helpful assistant. Use ONLY the context provided below.
If the answer is not in the context, say "I don't know."

Context:
${context}

User: ${message}
Answer:
  `;

  // Claude chat completion
  const completion = await anthropic.messages.create({
    model: "claude-3.5-sonnet",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300
  });

  const reply = completion.content[0].text;

  return res.json({ reply });
});

export default router;