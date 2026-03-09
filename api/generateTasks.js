import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { project_id, prompt } = req.body;

  if (!project_id || !prompt) {
    return res.status(400).json({ error: "Missing project_id or prompt" });
  }

  try {
    // 1. Fetch existing requirements to give AI context for linking
    const { data: requirements } = await supabase
      .from("requirements")
      .select("id, text, priority")
      .eq("project_id", project_id);

    // 2. Prompt AI
    const systemPrompt = `
      You are a Project Manager AI. Generate specific, actionable tasks based on the user's request.
      
      Context - Existing Project Requirements:
      ${JSON.stringify(requirements)}

      Instructions:
      1. Generate a list of tasks based on the User Prompt.
      2. If a task clearly relates to an existing requirement, set "requirement_id" to that requirement's UUID. Otherwise null.
      3. Set "priority" (1=High, 2=Med, 3=Low).
      4. Set "due_date" (YYYY-MM-DD) if implied (e.g. "due tomorrow"), otherwise null.
      5. Return JSON ONLY: { "tasks": [ { "name": "...", "description": "...", "priority": 1, "requirement_id": "...", "due_date": "..." } ] }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    const newTasks = result.tasks || [];

    if (newTasks.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: "No tasks generated." });
    }

    // 3. Add project_id and default status
    const tasksToInsert = newTasks.map(t => ({
      project_id,
      name: t.name,
      description: t.description,
      priority: t.priority || 2,
      status: "pending",
      requirement_id: t.requirement_id || null,
      due_date: t.due_date || null
    }));

    // 4. Insert into DB
    const { error } = await supabase.from("tasks").insert(tasksToInsert);
    if (error) throw error;

    return res.status(200).json({ success: true, count: tasksToInsert.length });

  } catch (err) {
    console.error("Task Gen Error:", err);
    return res.status(500).json({ error: err.message });
  }
}