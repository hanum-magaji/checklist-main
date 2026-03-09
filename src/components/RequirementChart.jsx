import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export default function RequirementChart({ requirements }) {
  const chartRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: "dark", 
      securityLevel: "loose",
      fontFamily: "inherit",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  useEffect(() => {
    if (!requirements || requirements.length === 0) return;

    let graph = "graph TD;\n";

    graph += "classDef cat fill:#1e1e1e,stroke:#4f46e5,stroke-width:2px,color:white;\n";
    graph += "classDef high fill:#3a0000,stroke:#e53935,stroke-width:1px,color:#ffbaba;\n";
    graph += "classDef med fill:#332b00,stroke:#ffb300,stroke-width:1px,color:#ffe082;\n";
    graph += "classDef low fill:#002e00,stroke:#43a047,stroke-width:1px,color:#c8e6c9;\n";

    const groups = {};
    requirements.forEach((req) => {
      const cat = req.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(req);
    });

    Object.entries(groups).forEach(([category, items], index) => {
      const catId = `cat_${index}`;
      const cleanCatName = category.replace(/["\n;]/g, ""); 
      
      graph += `${catId}["📂 ${cleanCatName}"]:::cat;\n`;

      items.forEach((item) => {
        const reqId = `req_${item.id.replace(/-/g, "")}`; 
        const cleanText = item.text.replace(/["\n;]/g, ""); 
        const wrappedText = cleanText.replace(/(.{30})/g, "$1<br/>"); 
        
        let styleClass = "med";
        if (item.priority === 1) styleClass = "high";
        if (item.priority === 3) styleClass = "low";

        graph += `${reqId}["${wrappedText}"]:::${styleClass};\n`;
        graph += `${catId} --> ${reqId};\n`;
      });
    });

    if (chartRef.current) {
      chartRef.current.innerHTML = graph;
      chartRef.current.removeAttribute("data-processed");
      
      try {
        mermaid.run({
            nodes: [chartRef.current]
        }).catch(e => console.error("Mermaid run error:", e));
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
      }
    }
  }, [requirements]);

  const containerStyle = isFullscreen ? {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 9999,
    background: "#151515",
    padding: "2rem",
    overflow: "auto",
    display: "grid",
    placeItems: "center"
  } : {
    marginTop: "2rem", 
    background: "#151515", 
    padding: "2rem", 
    borderRadius: "12px",
    border: "1px solid #333",
    overflow: "auto",
    minHeight: "500px", // Increased height
    display: "grid",      
    placeItems: "center"
  };

  return (
    <div className="chart-wrapper fade-up">
        <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
                position: isFullscreen ? "fixed" : "absolute",
                top: isFullscreen ? "20px" : "auto",
                right: isFullscreen ? "20px" : "20px",
                zIndex: 10000,
                background: "#333",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer"
            }}
        >
            {isFullscreen ? "Exit Fullscreen" : "⤢ Fullscreen"}
        </button>
        <div style={containerStyle}>
            <div ref={chartRef} className="mermaid" style={{ width: "100%" }}></div>
        </div>
    </div>
  );
}