import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { project_id, requirements } = req.body;

  if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
    return res.status(400).json({ error: "No requirements provided" });
  }

  // Prompt AI to categorize AND estimate priority
  const prompt = `
    You are an expert Business Analyst. 
    Analyze the following requirements. Group them into logical categories.
    Also, estimate the PRIORITY for each requirement (1 = Critical/High, 2 = Important/Medium, 3 = Nice-to-have/Low).
    
    Raw Requirements:
    ${JSON.stringify(requirements)}

    Return ONLY a JSON object with this structure:
    {
      "clusters": [
        { 
          "category": "Category Name", 
          "items": [ 
            { "text": "exact text of requirement", "priority": 1 }
          ] 
        }
      ]
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    const clusters = result.clusters || [];

    const rowsToInsert = [];
    
    clusters.forEach(group => {
      group.items.forEach(item => {
        // Handle both formats just in case AI slips up
        const text = typeof item === 'string' ? item : item.text;
        const prio = typeof item === 'string' ? 2 : item.priority;

        rowsToInsert.push({
          project_id,
          text: text,
          category: group.category,
          priority: prio,             // Actual Priority
          recommended_priority: prio, // AI Recommendation
          status: "pending"
        });
      });
    });

    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from("requirements").insert(rowsToInsert);
      if (error) throw error;
    }

    return res.status(200).json({ success: true, count: rowsToInsert.length });

  } catch (err) {
    console.error("Clustering failed:", err);
    return res.status(500).json({ error: err.message });
  }
}