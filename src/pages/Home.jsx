import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😢", label: "Missing You" },
  { emoji: "✨", label: "Excited" },
  { emoji: "😌", label: "Peaceful" },
];

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recentEntries, setRecentEntries] = useState([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [heartSent, setHeartSent] = useState(false);
  const [randomMemory, setRandomMemory] = useState(null);
  const [showRandom, setShowRandom] = useState(false);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "entries"), orderBy("createdAt", "desc"), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecentEntries(entries);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "entries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemoryCount(snapshot.size);
      setAllEntries(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const sendHeart = async () => {
    if (heartSent) return;
    setShowHeartAnim(true);
    setHeartSent(true);
    await addDoc(collection(db, "hearts"), {
      from: currentUser.displayName || currentUser.email,
      sentAt: serverTimestamp(),
    });
    setTimeout(() => setShowHeartAnim(false), 3000);
    setTimeout(() => setHeartSent(false), 10000);
  };

  const showRandomMemory = () => {
    if (allEntries.length === 0) return;
    const random = allEntries[Math.floor(Math.random() * allEntries.length)];
    setRandomMemory(random);
    setShowRandom(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: "Good morning", emoji: "🌤️" };
    if (hour < 17) return { greeting: "Good afternoon", emoji: "☀️" };
    if (hour < 21) return { greeting: "Good evening", emoji: "🌙" };
    return { greeting: "Good night", emoji: "✨" };
  };

  const { greeting, emoji } = getTimeOfDay();

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroBlob1} />
        <div style={styles.heroBlob2} />

        <div style={styles.heroContent}>
          <p style={styles.greetingText}>
            {emoji} {greeting}, {currentUser?.displayName?.split(" ")[0] || "Love"} 💕
          </p>
          <h1 style={styles.heroTitle}>Our Little World</h1>
          <p style={styles.heroSubtitle} className="text-script">
            "Every moment we share becomes a memory we treasure forever"
          </p>

          {/* Memory Counter */}
          <div style={styles.counterBadge} className="pulse-soft">
            <span style={styles.counterNumber}>{memoryCount}</span>
            <span style={styles.counterLabel}>memories created together 💝</span>
          </div>

          {/* CTA Buttons */}
          <div style={styles.heroBtns}>
            <button style={styles.primaryBtn} onClick={() => navigate("/new-entry")}>
              ✍️ Write Today's Entry
            </button>
            <button style={styles.secondaryBtn} onClick={() => navigate("/calendar")}>
              📅 Browse Memories
            </button>
          </div>
        </div>

        {/* Decorative floating elements */}
        <div style={{ ...styles.floatEl, top: "15%", right: "8%", fontSize: "3rem" }} className="float-animation">🌸</div>
        <div style={{ ...styles.floatEl, bottom: "20%", right: "5%", fontSize: "2rem", animationDelay: "1s" }} className="float-animation">💕</div>
        <div style={{ ...styles.floatEl, top: "30%", left: "3%", fontSize: "2.5rem", animationDelay: "2s" }} className="float-animation">🌷</div>
      </section>

      <div style={styles.content}>

        {/* Quick Actions Row */}
        <section style={styles.quickActions}>
          {/* Miss You Button */}
          <div style={styles.actionCard}>
            <h3 style={styles.actionTitle}>Thinking of you? 💭</h3>
            <p style={styles.actionDesc}>Send a little heart their way</p>
            <button
              style={{
                ...styles.heartBtn,
                ...(heartSent ? styles.heartBtnSent : {}),
              }}
              onClick={sendHeart}
            >
              {heartSent ? "💝 Heart Sent!" : "💗 I Miss You"}
            </button>
            {showHeartAnim && (
              <div style={styles.heartBurst}>
                {["💕", "💖", "💗", "💝", "🌸"].map((h, i) => (
                  <span key={i} style={{ ...styles.burstHeart, animationDelay: `${i * 0.1}s` }}>
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Random Memory */}
          <div style={styles.actionCard}>
            <h3 style={styles.actionTitle}>Surprise me! 🎲</h3>
            <p style={styles.actionDesc}>Revisit a random memory together</p>
            <button style={styles.randomBtn} onClick={showRandomMemory}>
              ✨ Random Memory
            </button>
          </div>

          {/* Today's mood */}
          <div style={styles.actionCard}>
            <h3 style={styles.actionTitle}>How are you feeling? 🌈</h3>
            <p style={styles.actionDesc}>Share your mood right now</p>
            <div style={styles.moodRow}>
              {MOODS.map((mood) => (
                <button
                  key={mood.label}
                  style={styles.moodBtn}
                  title={mood.label}
                  onClick={() => navigate("/new-entry", { state: { mood: mood.label } })}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Entries */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Memories 🌸</h2>
            <button style={styles.seeAllBtn} onClick={() => navigate("/calendar")}>
              See all →
            </button>
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: "2rem" }}>🌸</span>
              <p>Loading your memories...</p>
            </div>
          ) : recentEntries.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: "3rem" }}>📖</span>
              <p style={styles.emptyTitle}>No memories yet!</p>
              <p style={styles.emptyDesc}>Start writing your first entry together 💕</p>
              <button style={styles.primaryBtn} onClick={() => navigate("/new-entry")}>
                ✍️ Write First Entry
              </button>
            </div>
          ) : (
            <div style={styles.entriesGrid}>
              {recentEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{ ...styles.entryCard, animationDelay: `${i * 0.1}s` }}
                  className="fade-in-up"
                >
                  <div style={styles.entryHeader}>
                    <div style={styles.entryMoodBadge}>
                      {MOODS.find((m) => m.label === entry.mood)?.emoji || "💕"}
                    </div>
                    <div>
                      <p style={styles.entryAuthor}>{entry.authorName || "Someone special"}</p>
                      <p style={styles.entryDate}>{formatDate(entry.createdAt)}</p>
                    </div>
                  </div>

                  {entry.title && <h3 style={styles.entryTitle}>{entry.title}</h3>}

                  <p style={styles.entryText}>
                    {entry.text?.length > 180
                      ? entry.text.substring(0, 180) + "..."
                      : entry.text}
                  </p>

                  {entry.mood && (
                    <div style={styles.moodTag}>
                      {MOODS.find((m) => m.label === entry.mood)?.emoji} {entry.mood}
                    </div>
                  )}

                  {entry.mediaUrls?.length > 0 && (
                    <div style={styles.mediaPreview}>
                      <span style={styles.mediaCount}>
                        📎 {entry.mediaUrls.length} attachment{entry.mediaUrls.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Nav Cards */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Explore 💝</h2>
          <div style={styles.navCards}>
            {[
              { icon: "📅", title: "Calendar", desc: "Browse memories by date", path: "/calendar", color: "#ffe4e8" },
              { icon: "🖼️", title: "Gallery", desc: "All your photos & videos", path: "/gallery", color: "#ede0ff" },
              { icon: "🎙️", title: "Voice Memories", desc: "Listen to saved recordings", path: "/voice-memories", color: "#e0f0ff" },
              { icon: "✍️", title: "New Entry", desc: "Capture today's moment", path: "/new-entry", color: "#e8ffe4" },
            ].map((card) => (
              <div
                key={card.path}
                style={{ ...styles.navCard, background: card.color }}
                onClick={() => navigate(card.path)}
              >
                <span style={styles.navCardIcon}>{card.icon}</span>
                <h3 style={styles.navCardTitle}>{card.title}</h3>
                <p style={styles.navCardDesc}>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Random Memory Modal */}
      {showRandom && randomMemory && (
        <div style={styles.modalOverlay} onClick={() => setShowRandom(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowRandom(false)}>✕</button>
            <div style={styles.modalHeader}>
              <span style={{ fontSize: "2rem" }}>✨</span>
              <h3 style={styles.modalTitle}>A Memory From The Past</h3>
              <p style={styles.modalDate}>{formatDate(randomMemory.createdAt)}</p>
            </div>
            <div style={styles.divider} />
            {randomMemory.title && <h4 style={styles.modalEntryTitle}>{randomMemory.title}</h4>}
            <p style={styles.modalText}>{randomMemory.text}</p>
            {randomMemory.mood && (
              <div style={styles.moodTag}>
                {MOODS.find((m) => m.label === randomMemory.mood)?.emoji} {randomMemory.mood}
              </div>
            )}
            <p style={styles.modalAuthor}>— {randomMemory.authorName} 💕</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes burstOut {
          0% { transform: translate(0,0) scale(0); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff0f3 0%, #f5f0ff 50%, #fdf6e3 100%)",
  },
  hero: {
    position: "relative",
    padding: "80px 24px 60px",
    textAlign: "center",
    overflow: "hidden",
  },
  heroBlob1: {
    position: "absolute", width: "600px", height: "600px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,182,193,0.3) 0%, transparent 70%)",
    top: "-200px", left: "-100px", pointerEvents: "none",
  },
  heroBlob2: {
    position: "absolute", width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(196,167,255,0.2) 0%, transparent 70%)",
    bottom: "-150px", right: "-100px", pointerEvents: "none",
  },
  heroContent: { position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" },
  greetingText: {
    fontSize: "1.1rem", color: "#9e7676", fontFamily: "'Nunito', sans-serif",
    marginBottom: "12px", fontWeight: "600",
  },
  heroTitle: {
    fontFamily: "'Dancing Script', cursive",
    fontSize: "clamp(3rem, 7vw, 5rem)",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", marginBottom: "16px", lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: "1.2rem", color: "#b48aff",
    fontFamily: "'Dancing Script', cursive", marginBottom: "32px",
  },
  counterBadge: {
    display: "inline-flex", flexDirection: "column", alignItems: "center",
    background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)",
    borderRadius: "20px", padding: "16px 32px", marginBottom: "32px",
    border: "1px solid rgba(255,182,193,0.4)",
    boxShadow: "0 8px 32px rgba(255,133,161,0.15)",
  },
  counterNumber: {
    fontFamily: "'Dancing Script', cursive", fontSize: "3rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", lineHeight: 1,
  },
  counterLabel: {
    fontSize: "0.9rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif", marginTop: "4px",
  },
  heroBtns: { display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" },
  primaryBtn: {
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "16px",
    padding: "14px 28px", fontSize: "1rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 8px 24px rgba(255,77,109,0.3)",
    transition: "all 0.3s ease",
  },
  secondaryBtn: {
    background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)",
    color: "#6b4f4f", border: "1px solid rgba(255,182,193,0.5)",
    borderRadius: "16px", padding: "14px 28px", fontSize: "1rem",
    fontWeight: "700", fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    transition: "all 0.3s ease",
  },
  floatEl: { position: "absolute", pointerEvents: "none", zIndex: 0 },
  content: { maxWidth: "1100px", margin: "0 auto", padding: "0 24px 60px" },
  quickActions: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px", marginBottom: "48px",
  },
  actionCard: {
    background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
    borderRadius: "24px", padding: "28px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 8px 32px rgba(180,120,140,0.1)",
    position: "relative", overflow: "hidden",
  },
  actionTitle: {
    fontFamily: "'Playfair Display', serif", fontSize: "1.2rem",
    color: "#3d2c2c", marginBottom: "6px",
  },
  actionDesc: {
    fontSize: "0.88rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif", marginBottom: "20px",
  },
  heartBtn: {
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "14px",
    padding: "12px 24px", fontSize: "1rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 6px 20px rgba(255,77,109,0.3)",
    transition: "all 0.3s ease", width: "100%",
  },
  heartBtnSent: {
    background: "linear-gradient(135deg, #b48aff, #9b5de5)",
    boxShadow: "0 6px 20px rgba(155,93,229,0.3)",
  },
  heartBurst: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)", pointerEvents: "none",
  },
  burstHeart: {
    position: "absolute", fontSize: "1.5rem",
    animation: "burstOut 1s ease forwards",
    "--tx": `${(Math.random() - 0.5) * 100}px`,
    "--ty": `${(Math.random() - 0.5) * 100}px`,
  },
  randomBtn: {
    background: "linear-gradient(135deg, #c4a7ff, #9b5de5)",
    color: "white", border: "none", borderRadius: "14px",
    padding: "12px 24px", fontSize: "1rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 6px 20px rgba(155,93,229,0.3)",
    transition: "all 0.3s ease", width: "100%",
  },
  moodRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  moodBtn: {
    fontSize: "1.6rem", background: "#fff0f3", border: "2px solid #ffe4e8",
    borderRadius: "12px", padding: "8px 10px", cursor: "pointer",
    transition: "all 0.2s ease", lineHeight: 1,
  },
  section: { marginBottom: "48px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.8rem", color: "#3d2c2c",
  },
  seeAllBtn: {
    background: "none", border: "none", color: "#ff4d6d",
    fontSize: "0.95rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
  },
  entriesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" },
  entryCard: {
    background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)",
    borderRadius: "24px", padding: "28px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 8px 32px rgba(180,120,140,0.1)",
    transition: "all 0.3s ease", cursor: "pointer",
  },
  entryHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" },
  entryMoodBadge: {
    width: "48px", height: "48px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.4rem", flexShrink: 0,
  },
  entryAuthor: { fontWeight: "700", color: "#3d2c2c", fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem" },
  entryDate: { fontSize: "0.8rem", color: "#9e7676", fontFamily: "'Nunito', sans-serif" },
  entryTitle: {
    fontFamily: "'Playfair Display', serif", fontSize: "1.15rem",
    color: "#3d2c2c", marginBottom: "10px",
  },
  entryText: {
    fontSize: "0.92rem", color: "#6b4f4f",
    fontFamily: "'Nunito', sans-serif", lineHeight: "1.7",
    marginBottom: "14px",
  },
  moodTag: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: "#fff0f3", border: "1px solid #ffb3c1",
    borderRadius: "20px", padding: "4px 12px",
    fontSize: "0.82rem", color: "#c9184a",
    fontFamily: "'Nunito', sans-serif", fontWeight: "600",
  },
  mediaPreview: { marginTop: "12px" },
  mediaCount: { fontSize: "0.82rem", color: "#9b5de5", fontFamily: "'Nunito', sans-serif" },
  emptyState: {
    textAlign: "center", padding: "60px 24px",
    background: "rgba(255,255,255,0.7)", borderRadius: "24px",
    border: "1px dashed rgba(255,182,193,0.5)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
  },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "#3d2c2c" },
  emptyDesc: { color: "#9e7676", fontFamily: "'Nunito', sans-serif" },
  navCards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" },
  navCard: {
    borderRadius: "20px", padding: "28px 24px", cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.8)",
    boxShadow: "0 4px 20px rgba(180,120,140,0.1)",
    transition: "all 0.3s ease",
  },
  navCardIcon: { fontSize: "2.5rem", display: "block", marginBottom: "12px" },
  navCardTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: "#3d2c2c", marginBottom: "6px" },
  navCardDesc: { fontSize: "0.85rem", color: "#9e7676", fontFamily: "'Nunito', sans-serif" },
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(61,44,44,0.5)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2000, padding: "24px",
  },
  modal: {
    background: "white", borderRadius: "32px", padding: "40px",
    maxWidth: "520px", width: "100%", position: "relative",
    boxShadow: "0 24px 64px rgba(180,120,140,0.25)",
    border: "1px solid rgba(255,182,193,0.4)",
  },
  modalClose: {
    position: "absolute", top: "20px", right: "20px",
    background: "#fff0f3", border: "none", borderRadius: "50%",
    width: "36px", height: "36px", fontSize: "1rem",
    cursor: "pointer", color: "#6b4f4f", fontWeight: "700",
  },
  modalHeader: { textAlign: "center", marginBottom: "20px" },
  modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", color: "#3d2c2c", margin: "8px 0 4px" },
  modalDate: { fontSize: "0.85rem", color: "#9e7676", fontFamily: "'Nunito', sans-serif" },
  divider: { height: "1px", background: "linear-gradient(90deg, transparent, #ffb3c1, transparent)", margin: "16px 0" },
  modalEntryTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: "#3d2c2c", marginBottom: "12px" },
  modalText: { fontSize: "0.95rem", color: "#6b4f4f", fontFamily: "'Nunito', sans-serif", lineHeight: "1.8", marginBottom: "16px" },
  modalAuthor: { textAlign: "right", fontFamily: "'Dancing Script', cursive", fontSize: "1.1rem", color: "#b48aff" },
};

export default Home;