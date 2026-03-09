import { Link } from "react-router-dom";
import "./PreLoginNavbar.css";

export default function PreLoginNavbar() {
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Pricing", path: "/pricing" },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        
        {/* Left section */}
        <div className="nav-left">
          <div className="nav-logo">Checklist</div>

          <div className="nav-links">
            {navItems.map((item) => (
              <Link key={item.name} to={item.path} className="nav-link">
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right section */}
        <div className="nav-right">
          <Link to="/auth?mode=login" className="nav-btn-outline">
            Login
          </Link>

          <Link to="/auth?mode=signup" className="nav-btn-solid">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
