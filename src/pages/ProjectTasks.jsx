import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./ProjectTasks.css";

export default function ProjectTasks() {
  const { id: projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState([]);
  
  // New Task State
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    priority: 2,
    due_date: "",
    requirement_id: "",
    status: "pending",
  });

  // AI State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- DATA LOADING ---
  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setTasks(data);
  }

  async function fetchRequirements() {
    const { data, error } = await supabase
      .from("requirements")
      .select("id, text")
      .eq("project_id", projectId)
      .order("priority", { ascending: true });

    if (error) console.error(error);
    else setRequirements(data);
  }

  useEffect(() => {
    fetchTasks();
    fetchRequirements();
  }, [projectId]);

  // --- ACTIONS ---
  async function addTask() {
    if (!newTask.name.trim()) return;

    const payload = {
      project_id: projectId,
      ...newTask,
      requirement_id: newTask.requirement_id || null // Handle empty string
    };

    const { error } = await supabase.from("tasks").insert([payload]);

    if (error) {
      alert("Error adding task: " + error.message);
    } else {
      setNewTask({
        name: "",
        description: "",
        priority: 2,
        due_date: "",
        requirement_id: "",
        status: "pending",
      });
      fetchTasks();
    }
  }

  async function updateTask(taskId, updates) {
    await supabase.from("tasks").update(updates).eq("id", taskId);
    fetchTasks();
  }

  async function deleteTask(taskId) {
    if (!confirm("Delete this task?")) return;
    await supabase.from("tasks").delete().eq("id", taskId);
    fetchTasks();
  }

  // --- AI GENERATION (UPDATED) ---
  async function handleAiTaskGen() {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/generateTasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          prompt: aiPrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("AI Error: " + (data.error || "Unknown error"));
      } else {
        setAiPrompt(""); // Clear input on success
        fetchTasks();    // Refresh list
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setIsAiLoading(false);
    }
  }

  return (
    <div className="tasks-page fade-in">
      <h1 className="page-title">Project Tasks</h1>

      {/* --- AI SECTION --- */}
      <section className="ai-task-section fade-up">
        <div className="ai-header">
          <h3>✨ AI Task Assistant</h3>
          <p>Describe tasks you need, and AI will create them for you.</p>
        </div>
        <div className="ai-input-group">
          <textarea
            placeholder="e.g. 'Create 3 QA tasks for the login page and assign them High priority'"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
          />
          <button 
            className="ai-btn"
            onClick={handleAiTaskGen}
            disabled={isAiLoading}
          >
            {isAiLoading ? "Thinking..." : "Generate Tasks"}
          </button>
        </div>
      </section>

      {/* --- ADD TASK FORM --- */}
      <section className="add-task-container fade-up delayed-1">
        <h2>Add New Task</h2>
        
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Task Name</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              placeholder="Add details..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
            >
              <option value={1}>High</option>
              <option value={2}>Medium</option>
              <option value={3}>Low</option>
            </select>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label>Link to Requirement (Optional)</label>
            <select
              value={newTask.requirement_id}
              onChange={(e) => setNewTask({ ...newTask, requirement_id: e.target.value })}
            >
              <option value="">-- No Requirement --</option>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.text.length > 60 ? r.text.substring(0, 60) + "..." : r.text}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button className="primary-button" onClick={addTask}>
            Create Task
          </button>
        </div>
      </section>

      {/* --- TASK LIST --- */}
      <section className="tasks-list fade-up delayed-2">
        <h2 className="section-label">Active Tasks</h2>
        {tasks.length === 0 && <p className="empty-msg">No tasks found.</p>}
        
        {tasks.map((task) => (
          <div className="task-card" key={task.id}>
            <div className="task-main">
              <div className="task-header">
                <span className={`priority-dot p-${task.priority}`}></span>
                <h3 className="task-name">{task.name}</h3>
              </div>
              {task.description && <p className="task-desc">{task.description}</p>}
              
              <div className="task-meta-row">
                {task.due_date && <span className="meta-tag">📅 {task.due_date}</span>}
                {task.requirement_id && (
                  <span className="meta-tag req-tag">
                    🔗 Linked to Requirement
                  </span>
                )}
              </div>
            </div>

            <div className="task-actions">
              <select
                className={`status-select status-${task.status?.replace(" ", "-")}`}
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="done">Done</option>
              </select>

              <button
                className="delete-icon-btn"
                onClick={() => deleteTask(task.id)}
                title="Delete Task"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}