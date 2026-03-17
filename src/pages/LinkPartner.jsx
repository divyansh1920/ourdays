import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

const LinkPartner = () => {
  const { currentUser, refreshCoupleId, logout } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError("");
    try {
      const code = generateCode();

      await setDoc(doc(db, "couples", code), {
        coupleId: code,
        createdBy: currentUser.uid,
        members: [currentUser.uid],
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          coupleId: code,
          displayName: currentUser.displayName || "",
          email: currentUser.email,
        },
        { merge: true }
      );

      setGeneratedCode(code);
      setMode("created");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again 🌸");
      setMode(null);
    }
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    setLoading(true);
    setError("");
    const code = joinCode.trim().toUpperCase();

    if (code.length !== 6) {
      setError("Please enter a 6 letter code 💕");
      setLoading(false);
      return;
    }

    try {
      const coupleDocRef = doc(db, "couples", code);
      const coupleDoc = await getDoc(coupleDocRef);

      if (!coupleDoc.exists()) {
        setError("Room not found! Double check the code 💕");
        setLoading(false);
        return;
      }

      const coupleData = coupleDoc.data();
      const currentMembers = coupleData.members || [];

      // Already in this exact room — just navigate
      if (currentMembers.includes(currentUser.uid)) {
        await setDoc(
          doc(db, "users", currentUser.uid),
          {
            coupleId: code,
            displayName: currentUser.displayName || "",
            email: currentUser.email,
          },
          { merge: true }
        );
        await refreshCoupleId();
        navigate("/");
        return;
      }

      // Room is full
      if (currentMembers.length >= 2) {
        setError("This room already has two people 💕");
        setLoading(false);
        return;
      }

      // Join the room
      await setDoc(
        coupleDocRef,
        { members: [...currentMembers, currentUser.uid] },
        { merge: true }
      );

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          coupleId: code,
          displayName: currentUser.displayName || "",
          email: currentUser.email,
        },
        { merge: true }
      );

      await refreshCoupleId();
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again 🌸");
    }
    setLoading(false);
  };

  const handleContinue = async () => {
    await refreshCoupleId();
    navigate("/");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      {/* Floating decorations */}
      <span
        style={{ ...styles.floatEl, top: "8%", left: "6%", fontSize: "2rem" }}
        className="float-animation"
      >🌸</span>
      <span
        style={{ ...styles.floatEl, top: "12%", right: "20%", fontSize: "1.5rem", animationDelay: "1s" }}
        className="float-animation"
      >💕</span>
      <span
        style={{ ...styles.floatEl, bottom: "12%", left: "5%", fontSize: "1.8rem", animationDelay: "2s" }}
        className="float-animation"
      >🌷</span>
      <span
        style={{ ...styles.floatEl, bottom: "18%", right: "6%", fontSize: "1.4rem", animationDelay: "0.5s" }}
        className="float-animation"
      >✨</span>

      {/* Top buttons */}
      <div style={styles.topBtns}>
        <button style={styles.homeBtn} onClick={() => navigate("/")}>
          🏡 Back to Home
        </button>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          👋 Sign Out
        </button>
      </div>

      <div style={styles.scrollWrap}>
        <div style={styles.card} className="fade-in-up">

          {/* Logo */}
          <div style={styles.logoCircle}>
            <span style={{ fontSize: "2.5rem" }}>💝</span>
          </div>

          <h1 style={styles.title}>Set Up Your Private Space</h1>
          <p style={styles.subtitle}>
            Hi {currentUser?.displayName?.split(" ")[0] || "there"} 🌸 Create a
            room or join your partner's room to start sharing memories
          </p>

          {/* ── INITIAL OPTIONS ── */}
          {!mode && (
            <div style={styles.optionsWrap}>
              {/* Create Room */}
              <div style={styles.optionCard}>
                <span style={styles.optionIcon}>🏡</span>
                <h3 style={styles.optionTitle}>Create a Room</h3>
                <p style={styles.optionDesc}>
                  Start a new private couple space and invite your partner
                </p>
                <button
                  style={{
                    ...styles.createBtn,
                    opacity: loading ? 0.7 : 1,
                  }}
                  disabled={loading}
                  onClick={handleCreateRoom}
                >
                  {loading ? "Creating... 🌸" : "Create Room"}
                </button>
              </div>

              {/* OR divider */}
              <div style={styles.orDivider}>
                <div style={styles.orLine} />
                <span style={styles.orText}>or</span>
                <div style={styles.orLine} />
              </div>

              {/* Join Room */}
              <div style={styles.optionCard}>
                <span style={styles.optionIcon}>🔑</span>
                <h3 style={styles.optionTitle}>Join a Room</h3>
                <p style={styles.optionDesc}>
                  Enter the code your partner shared with you
                </p>
                <button
                  style={styles.joinBtn}
                  onClick={() => { setMode("join"); setError(""); }}
                >
                  Join Room
                </button>
              </div>

              {/* Error on initial screen */}
              {error && (
                <div style={styles.errorBox}>⚠️ {error}</div>
              )}
            </div>
          )}

          {/* ── JOIN MODE ── */}
          {mode === "join" && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Enter Your Partner's Code 🔑</h3>
              <p style={styles.sectionDesc}>
                Ask your partner to share their 6-letter room code
              </p>

              <input
                type="text"
                placeholder="ROSE42"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={styles.codeInput}
              />

              {error && <div style={styles.errorBox}>⚠️ {error}</div>}

              <div style={styles.btnRow}>
                <button
                  style={styles.backBtn}
                  onClick={() => {
                    setMode(null);
                    setError("");
                    setJoinCode("");
                  }}
                >
                  ← Back
                </button>
                <button
                  style={{
                    ...styles.submitBtn,
                    opacity: loading || joinCode.length < 6 ? 0.6 : 1,
                  }}
                  onClick={handleJoinRoom}
                  disabled={loading || joinCode.length < 6}
                >
                  {loading ? "Joining... 🌸" : "Join Our Space 💕"}
                </button>
              </div>
            </div>
          )}

          {/* ── CREATED MODE ── */}
          {mode === "created" && generatedCode && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Your Room is Ready! 🎉</h3>
              <p style={styles.sectionDesc}>
                Share this code with your partner so they can join:
              </p>

              {/* Code box */}
              <div style={styles.codeBox} onClick={copyCode}>
                <span style={styles.codeText}>{generatedCode}</span>
                <span style={styles.copyHint}>
                  {copied ? "✅ Copied!" : "📋 Tap to copy"}
                </span>
              </div>

              {/* Steps */}
              <div style={styles.stepsBox}>
                {[
                  "Share the code above with your partner",
                  "They sign up and choose Join a Room",
                  "They enter your code and you are connected 💕",
                ].map((step, i) => (
                  <div key={i} style={styles.step}>
                    <div style={styles.stepNum}>{i + 1}</div>
                    <span style={styles.stepText}>{step}</span>
                  </div>
                ))}
              </div>

              <button style={styles.submitBtn} onClick={handleContinue}>
                Enter Our World 🌸
              </button>

              <p style={styles.skipNote}>
                You can start writing entries now while your partner joins!
              </p>
            </div>
          )}

          {/* Bottom tagline */}
          <div style={styles.taglineDivider} />
          <p style={styles.tagline} className="text-script">
            "A private world, just for the two of you"
          </p>

        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff0f3 0%, #f5f0ff 50%, #fdf6e3 100%)",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "fixed", width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,182,193,0.35) 0%, transparent 70%)",
    top: "-150px", left: "-100px", pointerEvents: "none", zIndex: 0,
  },
  blob2: {
    position: "fixed", width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(196,167,255,0.25) 0%, transparent 70%)",
    bottom: "-100px", right: "-80px", pointerEvents: "none", zIndex: 0,
  },
  floatEl: {
    position: "fixed", pointerEvents: "none", zIndex: 0, userSelect: "none",
  },
  topBtns: {
    position: "fixed", top: "84px", right: "20px",
    zIndex: 100, display: "flex", gap: "10px", alignItems: "center",
  },
  homeBtn: {
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    border: "none", borderRadius: "12px", padding: "8px 16px",
    fontSize: "0.85rem", fontWeight: "600", color: "white",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 4px 14px rgba(255,77,109,0.3)",
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(255,182,193,0.5)",
    borderRadius: "12px", padding: "8px 16px",
    fontSize: "0.85rem", fontWeight: "600", color: "#c9184a",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    backdropFilter: "blur(12px)",
  },
  scrollWrap: {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "80px 24px 40px",
    position: "relative", zIndex: 1,
  },
  card: {
    background: "rgba(255,255,255,0.88)", backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)", borderRadius: "32px",
    padding: "44px 40px", width: "100%", maxWidth: "520px",
    boxShadow: "0 20px 60px rgba(255,133,161,0.2), 0 4px 24px rgba(180,120,140,0.1)",
    border: "1px solid rgba(255,182,193,0.4)", textAlign: "center",
  },
  logoCircle: {
    width: "80px", height: "80px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 20px",
    boxShadow: "0 8px 24px rgba(255,133,161,0.25)",
  },
  title: {
    fontFamily: "'Dancing Script', cursive", fontSize: "2.4rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", marginBottom: "12px",
  },
  subtitle: {
    color: "#9e7676", fontFamily: "'Nunito', sans-serif",
    fontSize: "0.92rem", marginBottom: "28px", lineHeight: "1.6",
  },
  optionsWrap: {
    display: "flex", flexDirection: "column", gap: "0",
  },
  optionCard: {
    background: "#fff8fa", borderRadius: "20px",
    padding: "24px 20px", border: "2px solid #ffe4e8",
    textAlign: "center",
  },
  optionIcon: {
    fontSize: "2.5rem", display: "block", marginBottom: "10px",
  },
  optionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.2rem", color: "#3d2c2c", marginBottom: "8px",
  },
  optionDesc: {
    fontSize: "0.84rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
    marginBottom: "16px", lineHeight: "1.5",
  },
  createBtn: {
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "14px",
    padding: "12px 28px", fontSize: "0.95rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 6px 20px rgba(255,77,109,0.3)",
    transition: "all 0.3s ease", width: "100%",
  },
  joinBtn: {
    background: "linear-gradient(135deg, #c4a7ff, #9b5de5)",
    color: "white", border: "none", borderRadius: "14px",
    padding: "12px 28px", fontSize: "0.95rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 6px 20px rgba(155,93,229,0.3)",
    transition: "all 0.3s ease", width: "100%",
  },
  orDivider: {
    display: "flex", alignItems: "center",
    gap: "12px", padding: "14px 0",
  },
  orLine: { flex: 1, height: "1px", background: "#ffe4e8" },
  orText: {
    color: "#9e7676", fontFamily: "'Nunito', sans-serif",
    fontSize: "0.9rem", fontWeight: "600",
  },
  section: { textAlign: "left", marginTop: "8px" },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.3rem", color: "#3d2c2c",
    marginBottom: "8px", textAlign: "center",
  },
  sectionDesc: {
    color: "#9e7676", fontFamily: "'Nunito', sans-serif",
    fontSize: "0.87rem", marginBottom: "20px",
    textAlign: "center", lineHeight: "1.5",
  },
  codeInput: {
    width: "100%", padding: "18px", borderRadius: "16px",
    border: "2px solid #ffe4e8", fontSize: "2rem", fontWeight: "700",
    fontFamily: "'Dancing Script', cursive",
    background: "#fff8fa", color: "#ff4d6d",
    outline: "none", textAlign: "center",
    letterSpacing: "10px", marginBottom: "14px",
    transition: "border-color 0.3s ease",
    boxSizing: "border-box",
  },
  errorBox: {
    background: "#fff0f0", border: "1px solid #ffb3b3",
    borderRadius: "12px", padding: "12px 16px",
    fontSize: "0.87rem", color: "#c9184a",
    fontFamily: "'Nunito', sans-serif",
    marginBottom: "14px", marginTop: "8px",
  },
  btnRow: {
    display: "flex", gap: "12px", marginTop: "4px",
  },
  backBtn: {
    flex: 1, background: "rgba(255,255,255,0.8)",
    border: "1px solid rgba(255,182,193,0.5)",
    borderRadius: "14px", padding: "13px",
    fontSize: "0.9rem", fontWeight: "600",
    color: "#6b4f4f", fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
  },
  submitBtn: {
    flex: 2, background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "14px",
    padding: "13px", fontSize: "0.95rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 6px 20px rgba(255,77,109,0.3)",
    width: "100%", marginTop: "4px", transition: "all 0.3s ease",
  },
  codeBox: {
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    borderRadius: "20px", padding: "24px",
    cursor: "pointer", marginBottom: "20px",
    border: "2px solid rgba(255,182,193,0.5)",
    textAlign: "center", transition: "all 0.3s ease",
  },
  codeText: {
    display: "block", fontFamily: "'Dancing Script', cursive",
    fontSize: "3rem", fontWeight: "700",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", letterSpacing: "8px",
  },
  copyHint: {
    display: "block", fontSize: "0.8rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif", marginTop: "8px",
  },
  stepsBox: {
    background: "#fff8fa", borderRadius: "16px",
    padding: "18px 20px", marginBottom: "20px",
    border: "1px solid #ffe4e8",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  step: { display: "flex", alignItems: "flex-start", gap: "12px" },
  stepNum: {
    width: "26px", height: "26px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ff85a1, #b48aff)",
    color: "white", fontSize: "0.78rem", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    fontSize: "0.87rem", color: "#6b4f4f",
    fontFamily: "'Nunito', sans-serif",
    lineHeight: "1.6", paddingTop: "3px",
  },
  skipNote: {
    fontSize: "0.8rem", color: "#b48aff",
    fontFamily: "'Nunito', sans-serif",
    marginTop: "14px", fontStyle: "italic", textAlign: "center",
  },
  taglineDivider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, #ffb3c1, transparent)",
    margin: "24px 0 16px",
  },
  tagline: {
    color: "#b48aff", fontSize: "1.05rem",
    fontFamily: "'Dancing Script', cursive", textAlign: "center",
  },
};

export default LinkPartner;