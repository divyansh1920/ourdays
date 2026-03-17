import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
      navigate("/");
    } catch (err) {
      if (err.code === "auth/user-not-found") setError("No account found with this email 💌");
      else if (err.code === "auth/wrong-password") setError("Wrong password, try again 🔐");
      else if (err.code === "auth/email-already-in-use") setError("Email already in use 💛");
      else if (err.code === "auth/weak-password") setError("Password must be at least 6 characters 🔑");
      else setError("Something went wrong. Please try again 🌸");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      {/* Floating decorative elements */}
      <div style={{ ...styles.floatingEl, top: "10%", left: "8%", fontSize: "2rem", animationDelay: "0s" }} className="float-animation">🌸</div>
      <div style={{ ...styles.floatingEl, top: "15%", right: "10%", fontSize: "1.5rem", animationDelay: "1s" }} className="float-animation">💕</div>
      <div style={{ ...styles.floatingEl, bottom: "20%", left: "5%", fontSize: "1.8rem", animationDelay: "2s" }} className="float-animation">🌷</div>
      <div style={{ ...styles.floatingEl, bottom: "15%", right: "8%", fontSize: "1.5rem", animationDelay: "0.5s" }} className="float-animation">✨</div>
      <div style={{ ...styles.floatingEl, top: "45%", left: "3%", fontSize: "1.2rem", animationDelay: "1.5s" }} className="float-animation">🎀</div>
      <div style={{ ...styles.floatingEl, top: "40%", right: "4%", fontSize: "1.4rem", animationDelay: "2.5s" }} className="float-animation">💝</div>

      {/* Card */}
      <div style={styles.card} className="fade-in-up">

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <span style={{ fontSize: "2.8rem" }}>🌸</span>
          </div>
          <h1 style={styles.title} className="text-script">OurDays</h1>
          <p style={styles.subtitle}>
            {isLogin
              ? "Welcome back, my love 💕"
              : "Create your shared journal 🌷"}
          </p>
        </div>

        {/* Toggle Tabs */}
        <div style={styles.tabContainer}>
          <button
            style={{ ...styles.tab, ...(isLogin ? styles.tabActive : styles.tabInactive) }}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Sign In
          </button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : styles.tabInactive) }}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Your Name 🌸</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  type="text"
                  placeholder="What should I call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={!isLogin}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address 💌</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>✉️</span>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password 🔐</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔑</span>
              <input
                type="password"
                placeholder="Your secret password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <span>Just a moment... 🌸</span>
            ) : isLogin ? (
              <span>Enter Our World 💕</span>
            ) : (
              <span>Begin Our Journey 🌷</span>
            )}
          </button>
        </form>

        {/* Footer note */}
        <p style={styles.footerNote}>
          {isLogin ? "New here? " : "Already have an account? "}
          <span
            style={styles.footerLink}
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
          >
            {isLogin ? "Create your journal 🌸" : "Sign in instead 💕"}
          </span>
        </p>

        <div style={styles.divider} />
        <p style={styles.tagline} className="text-script">
          "Every day with you is a memory worth keeping"
        </p>

      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #fff0f3 0%, #f5f0ff 50%, #fdf6e3 100%)",
  },
  blob1: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,182,193,0.35) 0%, transparent 70%)",
    top: "-100px",
    left: "-100px",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(196,167,255,0.25) 0%, transparent 70%)",
    bottom: "-80px",
    right: "-80px",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(253,210,220,0.2) 0%, transparent 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  floatingEl: {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 0,
    userSelect: "none",
  },
  card: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "32px",
    padding: "48px 44px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 20px 60px rgba(255,133,161,0.2), 0 4px 24px rgba(180,120,140,0.1)",
    border: "1px solid rgba(255,182,193,0.4)",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 8px 24px rgba(255,133,161,0.25)",
  },
  title: {
    fontSize: "3rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "8px",
    fontFamily: "'Dancing Script', cursive",
  },
  subtitle: {
    color: "#9e7676",
    fontSize: "1rem",
    fontFamily: "'Nunito', sans-serif",
  },
  tabContainer: {
    display: "flex",
    background: "#fff0f3",
    borderRadius: "16px",
    padding: "4px",
    marginBottom: "28px",
  },
  tab: {
    flex: 1,
    padding: "10px",
    borderRadius: "12px",
    fontSize: "0.95rem",
    fontWeight: "600",
    fontFamily: "'Nunito', sans-serif",
    transition: "all 0.3s ease",
    border: "none",
  },
  tabActive: {
    background: "linear-gradient(135deg, #ff85a1, #b48aff)",
    color: "white",
    boxShadow: "0 4px 12px rgba(255,133,161,0.35)",
  },
  tabInactive: {
    background: "transparent",
    color: "#9e7676",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#6b4f4f",
    fontFamily: "'Nunito', sans-serif",
    paddingLeft: "4px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "1.1rem",
    zIndex: 1,
    pointerEvents: "none",
  },
  input: {
    paddingLeft: "44px",
    paddingRight: "16px",
    paddingTop: "14px",
    paddingBottom: "14px",
    borderRadius: "14px",
    border: "2px solid #ffe4e8",
    fontSize: "0.95rem",
    fontFamily: "'Nunito', sans-serif",
    background: "#fffdf7",
    color: "#3d2c2c",
    width: "100%",
    transition: "all 0.3s ease",
    outline: "none",
  },
  errorBox: {
    background: "#fff0f0",
    border: "1px solid #ffb3b3",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "0.9rem",
    color: "#c9184a",
    fontFamily: "'Nunito', sans-serif",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #ff85a1 0%, #ff4d6d 50%, #b48aff 100%)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    fontSize: "1.05rem",
    fontWeight: "700",
    fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(255,77,109,0.35)",
    transition: "all 0.3s ease",
    marginTop: "4px",
    letterSpacing: "0.3px",
  },
  footerNote: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "0.9rem",
    color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
  },
  footerLink: {
    color: "#ff4d6d",
    cursor: "pointer",
    fontWeight: "600",
    textDecoration: "none",
  },
  divider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, #ffb3c1, transparent)",
    margin: "20px 0 16px",
  },
  tagline: {
    textAlign: "center",
    color: "#b48aff",
    fontSize: "1.05rem",
    fontFamily: "'Dancing Script', cursive",
  },
};

export default Login;