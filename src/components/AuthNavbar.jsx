import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./AuthNavbar.css";

export default function AuthNavbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => pathname.startsWith(path);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error logging out: " + error.message);
      return;
    }
    navigate("/");
  };

  return (
    <nav className="auth-navbar">
      <div className="auth-navbar-container">
        <div className="auth-navbar-left">
          <Link to="/dashboard" className="auth-logo">
            Checklist
          </Link>

          <div className="auth-nav-items">
            <Link
              to="/dashboard"
              className={isActive("/dashboard") ? "nav-item active" : "nav-item"}
            >
              Dashboard
            </Link>

            <Link
              to="/projects"
              className={isActive("/projects") ? "nav-item active" : "nav-item"}
            >
              Projects
            </Link>

            <Link
              to="/inbox"
              className={isActive("/inbox") ? "nav-item active" : "nav-item"}
            >
              Inbox
            </Link>
          </div>
        </div>

        <div className="auth-navbar-right">
          <Link
            to="/settings"
            className={isActive("/settings") ? "nav-item active" : "nav-item"}
          >
            Settings
          </Link>

          <button className="nav-item logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
