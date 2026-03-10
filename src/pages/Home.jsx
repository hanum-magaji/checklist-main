import React from "react";
import { Link } from "react-router-dom";
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <section className="home-hero">
        <h1 className="text-center text-6xl md:text-8xl font-extrabold mx-auto">
          Checklist
        </h1>
        <p className="home-subtitle">
          Turn rough ideas into structured, actionable requirements — powered by AI.
        </p>
        <div className="home-actions">
          <Link to="/auth?mode=signup" className="btn-primary">Get Started</Link>
          <Link to="/auth?mode=login" className="btn-ghost">Log In</Link>
        </div>
      </section>

      <section className="home-features">
        <ul>
          <li>
            <span className="feature-label">AI Requirements</span>
            <span className="feature-desc">Turn rough ideas into structured, actionable requirements.</span>
          </li>
          <li>
            <span className="feature-label">Auto Prioritization</span>
            <span className="feature-desc">Let AI identify critical features for your stakeholders.</span>
          </li>
          <li>
            <span className="feature-label">Progress Tracking</span>
            <span className="feature-desc">Monitor status, priorities, and requirement evolution.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default Home;
