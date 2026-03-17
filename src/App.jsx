import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Home from "./pages/Home";
import CalendarPage from "./pages/CalendarPage";
import NewEntry from "./pages/NewEntry";
import Gallery from "./pages/Gallery";
import VoiceMemories from "./pages/VoiceMemories";
import LinkPartner from "./pages/LinkPartner";
import Navbar from "./components/Navbar";
import FloatingHearts from "./components/FloatingHearts";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

const CoupleRoute = ({ children }) => {
  const { currentUser, coupleId } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (!coupleId) return <Navigate to="/link-partner" />;
  return children;
};

const AppContent = () => {
  const { currentUser, coupleId } = useAuth();

  return (
    <>
      {currentUser && coupleId && <FloatingHearts />}
      {currentUser && coupleId && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/link-partner"
          element={
            <ProtectedRoute>
              <LinkPartner />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<CoupleRoute><Home /></CoupleRoute>} />
        <Route path="/calendar" element={<CoupleRoute><CalendarPage /></CoupleRoute>} />
        <Route path="/new-entry" element={<CoupleRoute><NewEntry /></CoupleRoute>} />
        <Route path="/gallery" element={<CoupleRoute><Gallery /></CoupleRoute>} />
        <Route path="/voice-memories" element={<CoupleRoute><VoiceMemories /></CoupleRoute>} />
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