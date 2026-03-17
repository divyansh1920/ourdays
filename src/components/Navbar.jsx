import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { path: "/", label: "Home", icon: "🏡" },
  { path: "/calendar", label: "Calendar", icon: "📅" },
  { path: "/new-entry", label: "New Entry", icon: "✍️" },
  { path: "/gallery", label: "Gallery", icon: "🖼️" },
  { path: "/voice-memories", label: "Voices", icon: "🎙️" },
];

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav style={styles.nav}>
        <div style={styles.inner}>
          {/* Logo */}
          <div style={styles.logo} onClick={() => navigate("/")}>
            <span style={{ fontSize: "1.6rem" }}>🌸</span>
            <span style={styles.logoText}>OurDays</span>
          </div>

          {/* Nav Links */}
          <div style={styles.links}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    ...styles.navBtn,
                    ...(isActive ? styles.navBtnActive : styles.navBtnInactive),
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div style={styles.right}>
            <span style={styles.greeting}>
              Hi, {currentUser?.displayName?.split(" ")[0] || "Love"} 💕
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Bye for now 👋
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            style={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={styles.mobileMenu}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  style={{
                    ...styles.mobileNavBtn,
                    ...(isActive ? styles.mobileNavBtnActive : {}),
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
              👋 Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div style={{ height: "72px" }} />
    </>
  );
};

const styles = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 4px 24px rgba(255,133,161,0.12)",
  },
  inner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px",
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Dancing Script', cursive",
    fontSize: "1.8rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: "700",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "nowrap",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "600",
    fontFamily: "'Nunito', sans-serif",
    border: "none",
    cursor: "pointer",
    transition: "all 0.25s ease",
    whiteSpace: "nowrap",
  },
  navBtnActive: {
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    color: "#c9184a",
    boxShadow: "0 2px 12px rgba(255,133,161,0.2)",
  },
  navBtnInactive: {
    background: "transparent",
    color: "#6b4f4f",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  greeting: {
    fontSize: "0.85rem",
    color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "#fff0f3",
    border: "1px solid #ffb3c1",
    borderRadius: "10px",
    padding: "7px 14px",
    fontSize: "0.82rem",
    fontWeight: "600",
    color: "#c9184a",
    fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.25s ease",
  },
  hamburger: {
    display: "none",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#6b4f4f",
    padding: "8px",
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 20px 20px",
    gap: "8px",
    borderTop: "1px solid rgba(255,182,193,0.2)",
  },
  mobileNavBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#fff0f3",
    color: "#6b4f4f",
    fontSize: "0.95rem",
    fontWeight: "600",
    fontFamily: "'Nunito', sans-serif",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
  },
  mobileNavBtnActive: {
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    color: "#c9184a",
  },
  mobileLogoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#fff0f0",
    color: "#c9184a",
    fontSize: "0.95rem",
    fontWeight: "600",
    fontFamily: "'Nunito', sans-serif",
    border: "1px solid #ffb3b3",
    cursor: "pointer",
    marginTop: "4px",
  },
};

// Add responsive styles
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @media (max-width: 768px) {
    .nav-links { display: none !important; }
    .nav-right { display: none !important; }
    .nav-hamburger { display: flex !important; }
  }
`;
document.head.appendChild(styleTag);

export default Navbar;