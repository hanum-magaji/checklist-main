import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail"; // This is now /requirements
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import CreateProject from "./pages/CreateProject";
import ProjectCollaborators from "./pages/ProjectCollaborators";
import ProjectDiscussions from "./pages/Discussions";
import ProjectThreadView from "./pages/ThreadView";
import ProjectCalendar from "./pages/ProjectCalendar";
import ProjectTasks from "./pages/ProjectTasks";
import ProjectTimeline from "./pages/ProjectTimeline";
import Inbox from "./pages/Inbox";
import ProjectOverview from "./pages/ProjectOverview"; // Make sure this is imported
import ProjectSettings from "./pages/ProjectSettings";

import PreLoginNavbar from "./components/PreLoginNavbar";
import AuthNavbar from "./components/AuthNavbar";
import ProjectSidebar from "./components/ProjectSidebar";

import "./index.css";

/* -----------------------------------------
   Protected Route
----------------------------------------- */
function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!session) return <Navigate to="/auth" />;
  return children;
}

/* -----------------------------------------
   Wrapper for ALL project pages (sidebar + content)
----------------------------------------- */
function ProjectLayout() {
  const { id } = useParams();

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <ProjectSidebar projectId={id} />
      <div style={{ flex: 1, width: "100%" }}>
        <Routes>
          {/* Default project page is now OVERVIEW */}
          <Route index element={<ProjectOverview />} />

          {/* Requirements page */}
          <Route path="requirements" element={<ProjectDetail />} />

          {/* Other project subpages */}
          <Route path="collaborators" element={<ProjectCollaborators />} />
          <Route path="calendar" element={<ProjectCalendar />} />
          <Route path="tasks" element={<ProjectTasks />} />
          <Route path="timeline" element={<ProjectTimeline />} />
          <Route path="discussions" element={<ProjectDiscussions />} />
          <Route path="discussions/:threadId" element={<ProjectThreadView />} />
          
          {/* Project settings (per-project) */}
          <Route path="settings" element={<ProjectSettings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="." />} />
        </Routes>
      </div>
    </div>
  );
}

/* -----------------------------------------
   App Content
----------------------------------------- */
function AppContent() {
  const location = useLocation();

  const publicRoutes = ["/", "/pricing", "/auth"];
  const isPublic = publicRoutes.includes(location.pathname);

  return (
    <>
      {/* NAVBAR (renders exactly once) */}
      {isPublic ? <PreLoginNavbar /> : <AuthNavbar />}

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Inbox */}
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Project list */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        {/* Create Project */}
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />

        {/* ALL project content uses ProjectLayout */}
        <Route
          path="/projects/:id/*"
          element={
            <ProtectedRoute>
              <ProjectLayout />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

/* -----------------------------------------
   App Root
----------------------------------------- */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;