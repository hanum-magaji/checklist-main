import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import RequirementChart from "../components/RequirementChart";
import "./ProjectDetail.css";

export default function ProjectDetail() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [groupedReqs, setGroupedReqs] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  
  const [newReqText, setNewReqText] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [openPriorityMenu, setOpenPriorityMenu] = useState(null); 
  const [draggedReqId, setDraggedReqId] = useState(null);

  // --- DATA ---
  async function fetchProject() {
    const { data } = await supabase.from("projects").select("*").eq("id", id).single();
    setProject(data);
  }

  async function fetchRequirements() {
    const { data } = await supabase
      .from("requirements")
      .select("*")
      .eq("project_id", id)
      .order("priority", { ascending: true })
      .order("created_at");

    if (data) {
      setRequirements(data);
      const groups = {};
      // Ensure at least "General" exists if empty
      if (data.length === 0) groups["General"] = [];

      data.forEach((req) => {
        const cat = req.category || "General";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(req);
      });
      setGroupedReqs(groups);
    }
    setLoading(false);
  }

  // --- ACTIONS ---
  async function addRequirement(category) {
    if (!newReqText.trim()) return;
    await supabase.from("requirements").insert([{
      project_id: id,
      text: newReqText,
      category: category,
      priority: 2,
      recommended_priority: 2,
      status: "pending",
    }]);
    setNewReqText("");
    setActiveCategory(null);
    fetchRequirements();
  }

  async function updateRequirement(reqId, updates) {
    setGroupedReqs(prev => {
      const newGroups = { ...prev };
      // Optimistic update
      for (const cat in newGroups) {
        newGroups[cat] = newGroups[cat].map(r => r.id === reqId ? { ...r, ...updates } : r);
        
        // If category changed, move it (for optimistic drag drop)
        if (updates.category && cat !== updates.category) {
             // Logic handled by fetch but simple optimistic move can be complex, rely on fetch for category change correctness
        }
      }
      return newGroups;
    });
    await supabase.from("requirements").update(updates).eq("id", reqId);
    fetchRequirements();
  }

  async function deleteRequirement(reqId) {
    if (!confirm("Delete this requirement?")) return;
    await supabase.from("requirements").delete().eq("id", reqId);
    fetchRequirements();
  }

  const createNewCluster = async () => {
    const name = prompt("Enter name for new cluster:");
    if (name) {
      // We just add an empty key to local state so the UI renders a drop zone
      setGroupedReqs(prev => ({ ...prev, [name]: [] }));
    }
  };

  // --- DRAG AND DROP ---
  const handleDragStart = (e, reqId) => {
    setDraggedReqId(reqId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    if (!draggedReqId) return;

    // Find the req to ensure we aren't dropping on same category needlessly
    const req = requirements.find(r => r.id === draggedReqId);
    if (req && req.category !== targetCategory) {
        // Optimistic UI update
        setGroupedReqs(prev => {
            const newGroups = { ...prev };
            // Remove from old
            const oldCat = req.category || "General";
            if (newGroups[oldCat]) {
                newGroups[oldCat] = newGroups[oldCat].filter(r => r.id !== draggedReqId);
            }
            // Add to new
            if (!newGroups[targetCategory]) newGroups[targetCategory] = [];
            newGroups[targetCategory].push({ ...req, category: targetCategory });
            return newGroups;
        });

        // API Update
        await supabase.from("requirements").update({ category: targetCategory }).eq("id", draggedReqId);
        fetchRequirements(); // Sync fully
    }
    setDraggedReqId(null);
  };

  const getPriorityLabel = (p) => (p === 1 ? "High" : p === 2 ? "Med" : "Low");

  // --- INIT ---
  useEffect(() => {
    fetchProject();
    fetchRequirements();
    const channel = supabase
      .channel('realtime-reqs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requirements', filter: `project_id=eq.${id}` }, () => fetchRequirements())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]);

  if (!project) return <p className="loading">Loading...</p>;

  return (
    <div className="project-detail-page animate">
      <div className="project-header fade-up">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <div>
                <h1>{project.name}</h1>
                <p>{project.description}</p>
            </div>
            <div className="view-toggle">
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
                <button className={viewMode === 'chart' ? 'active' : ''} onClick={() => setViewMode('chart')}>Diagram</button>
            </div>
        </div>
      </div>

      {viewMode === 'chart' && <RequirementChart requirements={requirements} />}

      {viewMode === 'list' && (
        <>
            <div className="toolbar fade-up">
                <button className="btn-secondary" onClick={createNewCluster}>+ New Cluster</button>
            </div>

            <div className="groups-container fade-up delayed-1">
                {Object.entries(groupedReqs).map(([category, items]) => (
                <div 
                    key={category} 
                    className="group-card"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, category)}
                >
                    <div className="group-header">
                        <h3>{category}</h3>
                        <span className="count-badge">{items.length}</span>
                    </div>

                    <div className="group-items">
                    {items.map((req) => (
                        <div 
                            key={req.id} 
                            className={`req-item priority-${req.priority} ${req.status === 'done' ? 'completed' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, req.id)}
                        >
                        
                        <div className="checkbox-wrapper">
                            <input 
                            type="checkbox" 
                            checked={req.status === 'done'} 
                            onChange={() => updateRequirement(req.id, { status: req.status === 'done' ? 'pending' : 'done' })}
                            />
                        </div>

                        <div className="req-content">
                            <textarea 
                                className="req-input"
                                value={req.text}
                                onChange={(e) => {
                                    e.target.style.height = "auto";
                                    e.target.style.height = e.target.scrollHeight + "px";
                                    updateRequirement(req.id, { text: e.target.value });
                                }}
                                ref={(el) => {
                                    if (el) {
                                    el.style.height = "auto";
                                    el.style.height = el.scrollHeight + "px";
                                    }
                                }}
                                rows={1}
                            />
                        </div>

                        <div className="req-actions">
                            <div className="priority-wrapper">
                                <button 
                                className={`badge p-${req.priority}`}
                                onClick={() => setOpenPriorityMenu(openPriorityMenu === req.id ? null : req.id)}
                                >
                                {getPriorityLabel(req.priority)}
                                </button>

                                {openPriorityMenu === req.id && (
                                <div className="priority-menu">
                                    {[1, 2, 3].map(p => (
                                    <div 
                                        key={p} 
                                        className={`priority-option ${req.priority === p ? 'selected' : ''}`}
                                        onClick={() => {
                                        updateRequirement(req.id, { priority: p });
                                        setOpenPriorityMenu(null);
                                        }}
                                    >
                                        <span>{getPriorityLabel(p)}</span>
                                        {req.recommended_priority === p && <span className="rec-tag">⭐ Rec</span>}
                                    </div>
                                    ))}
                                </div>
                                )}
                            </div>

                            <button className="btn-icon" onClick={() => deleteRequirement(req.id)}>✕</button>
                        </div>
                        </div>
                    ))}
                    </div>

                    {activeCategory === category ? (
                    <div className="quick-add-form">
                        <input 
                        autoFocus
                        placeholder={`Add new ${category} requirement...`}
                        value={newReqText}
                        onChange={(e) => setNewReqText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addRequirement(category)}
                        />
                        <button onClick={() => addRequirement(category)}>Save</button>
                    </div>
                    ) : (
                    <button className="add-btn-small" onClick={() => setActiveCategory(category)}>+ Add Item</button>
                    )}
                </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
}