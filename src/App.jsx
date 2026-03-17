import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import CalendarPage from "./pages/CalendarPage";
import NewEntry from "./pages/NewEntry";
import Gallery from "./pages/Gallery";
import VoiceMemories from "./pages/VoiceMemories";

// Components
import Navbar from "./components/Navbar";
import FloatingHearts from "./components/FloatingHearts";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser && <FloatingHearts />}
      {currentUser && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-entry"
          element={
            <ProtectedRoute>
              <NewEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/voice-memories"
          element={
            <ProtectedRoute>
              <VoiceMemories />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;