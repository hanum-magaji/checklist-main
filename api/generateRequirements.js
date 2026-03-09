import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  if (!supabase) {
    return res.status(500).json({
      error:
        "Supabase not configured. Ensure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.",
    });
  }

  const { project_id, description } = req.body;
  if (!project_id || !description) {
    return res.status(400).json({ error: "Missing project_id or description" });
  }

  const prompt = `
You are an expert software product manager.
Generate a JSON array of requirements in this format ONLY:

[
  { "text": "The system shall ...", "priority": 1 },
  { "text": "...", "priority": 2 }
]

No explanations. No comments. No markdown fences.

Project Description:
${description}
`;

  try {
    // --- Call OpenAI using the new Responses API ---
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 2048,
    });

    let raw = completion.output_text;

    console.log("GPT Output Raw:", raw);

    // --- CLEANUP GPT OUTPUT ---
    raw = raw.replace(/```json/i, "");
    raw = raw.replace(/```/g, "");
    raw = raw.trim();

    // If GPT wrapped JSON inside other text, extract first array
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({
        error: "Could not find JSON array in model output.",
        raw,
      });
    }

    const jsonBlock = match[0];

    let requirements;
    try {
      requirements = JSON.parse(jsonBlock);
    } catch (err) {
      console.error("JSON parse failure:", jsonBlock);
      return res.status(500).json({
        error: "Failed to parse GPT output",
        raw: jsonBlock,
      });
    }

    // --- Insert Requirements Safely ---
    const inserts = requirements.map((r) => ({
      project_id,
      text: r.text,
      priority: r.priority || 2,
      status: "pending",
    }));

    const { error: insertErr } = await supabase
      .from("requirements")
      .insert(inserts);

    if (insertErr) {
      console.error(insertErr);
      return res.status(500).json({ error: "Failed to save requirements" });
    }

    return res.status(200).json({ success: true, requirements });
  } catch (err) {
    console.error("OpenAI Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "OpenAI request failed" });
  }
}
