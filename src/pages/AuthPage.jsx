// src/pages/AuthPage.jsx

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./AuthPage.css";

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") || "login";

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* --------------------------------------------------------
     Sync UI mode with URL changes
  -------------------------------------------------------- */
  useEffect(() => {
    const urlMode = searchParams.get("mode") || "login";
    if (urlMode !== mode) {
      setMode(urlMode);
    }
  }, [searchParams]);


  /* --------------------------------------------------------
     Change Mode + Update URL
  -------------------------------------------------------- */
  function switchMode(newMode) {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  }


  /* --------------------------------------------------------
     Submit handler
  -------------------------------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      navigate("/projects");
      return;
    }

    // SIGN UP MODE
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Create user profile
    if (data?.user) {
      await supabase.from("users").insert([
        {
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email,
        },
      ]);
    }

    alert("Account created! Check your email for verification if required.");
    setLoading(false);
    navigate("/projects");
  }


  return (
    <div className="auth-container fade-in">
      <div className="auth-card fade-up">

        <div className="auth-brand">Checklist</div>

        <h1 className="auth-title">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to continue"
            : "Start your journey by creating an account"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {/* First/last name only in signup */}
          {mode === "signup" && (
            <>
              <input
                className="auth-input"
                type="text"
                placeholder="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <input
                className="auth-input"
                type="text"
                placeholder="Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </>
          )}

          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="auth-button" type="submit" disabled={loading}>
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <span onClick={() => switchMode("signup")}>Sign Up</span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span onClick={() => switchMode("login")}>Log In</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
