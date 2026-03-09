// src/pages/ProjectOverview.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./ProjectOverview.css";

export default function ProjectOverview() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Fetch Project Details
      const { data: projData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      
      if (projData) setProject(projData);

      // 2. Fetch Tasks to calculate stats
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id);

      if (tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done').length;
        const pending = total - completed;
        
        // Calculate tasks due today (local date comparison)
        const todayStr = new Date().toISOString().split('T')[0];
        const dueToday = tasks.filter(t => t.due_date === todayStr && t.status !== 'done');

        setStats({ total, completed, pending });
        setTodaysTasks(dueToday);
      }
      
      setLoading(false);
    }

    loadData();
  }, [id]);

  if (loading) return <div className="overview-page"><p>Loading...</p></div>;
  if (!project) return <div className="overview-page"><p>Project not found.</p></div>;

  return (
    <div className="overview-page fade-in">
      {/* Header */}
      <div className="overview-header">
        <h1>{project.name}</h1>
        <p className="project-id">{project.id}</p>
        <p className="subtitle">Project Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-container fade-up">
        <div className="stat-box">
          <h3>Total Tasks</h3>
          <div className="stat-number">{stats.total}</div>
        </div>
        <div className="stat-box">
          <h3>Completed Tasks</h3>
          <div className="stat-number">{stats.completed}</div>
        </div>
        <div className="stat-box">
          <h3>Pending Tasks</h3>
          <div className="stat-number">{stats.pending}</div>
        </div>
      </div>

      {/* Tasks Due Today */}
      <div className="todays-tasks-section fade-up delayed-1">
        <h3>Tasks Due Today</h3>
        {todaysTasks.length === 0 ? (
          <p className="no-tasks-msg">No tasks due today.</p>
        ) : (
          <div className="task-list-mini">
            {todaysTasks.map(t => (
              <div key={t.id} className="mini-task-card">
                <span>{t.name}</span>
                <span className={`priority-dot p-${t.priority}`}></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}