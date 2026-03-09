import { Link, useParams, useLocation } from "react-router-dom";
import "./ProjectSidebar.css";

export default function ProjectSidebar() {
  const { id } = useParams();
  const { pathname } = useLocation();

  const active = (segment) => pathname.includes(segment);
  const isOverview = pathname === `/projects/${id}` || pathname === `/projects/${id}/`;

  const navItems = [
    { label: "Overview", path: `/projects/${id}`, key: "overview" },
    { label: "Requirements", path: `/projects/${id}/requirements`, key: "requirements" },
    { label: "Tasks", path: `/projects/${id}/tasks`, key: "tasks" },
    { label: "Timeline", path: `/projects/${id}/timeline`, key: "timeline" },
    { label: "Discussions", path: `/projects/${id}/discussions`, key: "discussions" },
    { label: "Collaborators", path: `/projects/${id}/collaborators`, key: "collaborators" },
  ];

  const settingsPath = `/projects/${id}/settings`;
  const isSettings = active("settings");

  const isItemActive = (item) => {
    if (item.key === "overview") return isOverview;
    return active(item.key);
  };

  return (
    <nav className="project-nav">
      <div className="project-nav-container">
        <div className="project-nav-items">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`project-nav-item ${isItemActive(item) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="project-nav-divider"></div>
        
        <Link
          to={settingsPath}
          className={`project-nav-item settings ${isSettings ? 'active' : ''}`}
        >
          Settings
        </Link>
      </div>
    </nav>
  );
}