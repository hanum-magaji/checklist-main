import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./CreateProject.css";

export default function CreateProject() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rawReqs, setRawReqs] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  async function handleCreate() {
    if (!name) return alert("Project name required");
    if (!session?.user?.id) return alert("You must be logged in");

    setLoading(true);
    setStatusMsg("Creating project...");

    try {
      // 1. Create Project
      const { data: project, error } = await supabase
        .from("projects")
        .insert([
          {
            name,
            description,
            owner_user_id: session.user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // 2. If user entered requirements, send them to AI for Clustering
      if (rawReqs.trim()) {
        setStatusMsg("AI is analyzing and grouping your requirements...");
        
        const reqList = rawReqs.split('\n').filter(line => line.trim() !== "");

        const res = await fetch("/api/clusterRequirements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: project.id,
            requirements: reqList,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("AI Clustering failed:", errData);
          alert("Project created, but AI grouping failed. You can add requirements manually.");
        }
      }

      setLoading(false);
      navigate(`/projects/${project.id}`);

    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Failed to create project: " + error.message);
    }
  }

  return (
    <div className="create-container fade-in">
      <div className="create-inner fade-up">
        <h1 className="create-title">Create New Project</h1>
        <p className="create-subtitle">
          Input your requirements, and our AI will organize them for you.
        </p>

        <div className="create-card">
          <label className="input-label">Project Name</label>
          <input
            className="input-field"
            placeholder="e.g., Smart Traffic System"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="input-label">Short Description</label>
          <input
            className="input-field"
            placeholder="Brief summary..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="input-label">Initial Requirements (One per line)</label>
          <textarea
            className="textarea-field"
            rows={8}
            placeholder={`Example:\nUsers must log in via email\nAdmin can delete posts\nSystem should support Dark Mode`}
            value={rawReqs}
            onChange={(e) => setRawReqs(e.target.value)}
          ></textarea>

          <div className="create-buttons">
            <button
              className="btn primary"
              disabled={loading}
              onClick={handleCreate}
            >
              {loading ? statusMsg : "Create Project & Group Requirements"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}