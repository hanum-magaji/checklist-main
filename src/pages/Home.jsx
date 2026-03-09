import React from "react";
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className="home-title">Supercharge Your AI Projects</h1>
        <p className="home-subtitle">
          Turn ideas into actionable requirements with AI-powered automation.
        </p>

        <div className="home-links">
          <a href="/auth" className="btn primary">Get Started</a>
          <a href="/auth" className="btn secondary">Log In</a>
        </div>
      </div>

      <div className="home-features">
        <h2 className="features-title">What You Can Do</h2>
        <ul>
          <li><strong>AI-Generated Requirements</strong> — Turn rough ideas into structured, actionable requirements.</li>
          <li><strong>Automatic Prioritization</strong> — Let AI identify critical features for stakeholders.</li>
          <li><strong>Track Progress</strong> — Monitor status, priorities, and requirement evolution.</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
