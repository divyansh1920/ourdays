import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

const MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😢", label: "Missing You" },
  { emoji: "✨", label: "Excited" },
  { emoji: "😌", label: "Peaceful" },
];

const Gallery = () => {
  const navigate = useNavigate();
  const [allMedia, setAllMedia] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "entries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const media = [];
      snapshot.docs.forEach((doc) => {
        const entry = { id: doc.id, ...doc.data() };
        if (entry.mediaUrls?.length > 0) {
          entry.mediaUrls.forEach((m) => {
            media.push({
              ...m,
              entryId: entry.id,
              entryTitle: entry.title,
              entryDate: entry.date,
              authorName: entry.authorName,
              mood: entry.mood,
              createdAt: entry.createdAt,
            });
          });
        }
      });
      setAllMedia(media);
      setFiltered(media);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (filter === "all") setFiltered(allMedia);
    else if (filter === "photos") setFiltered(allMedia.filter(m => m.type?.startsWith("image/")));
    else if (filter === "videos") setFiltered(allMedia.filter(m => m.type?.startsWith("video/")));
    else if (filter === "audio") setFiltered(allMedia.filter(m => m.type?.startsWith("audio/")));
  }, [filter, allMedia]);

  const openLightbox = (item, index) => {
    setLightbox(item);
    setLightboxIndex(index);
  };

  const closeLightbox = () => setLightbox(null);

  const prevItem = () => {
    const imageItems = filtered.filter(m => m.type?.startsWith("image/"));
    const currentIndex = imageItems.findIndex(m => m.url === lightbox.url);
    const prev = imageItems[(currentIndex - 1 + imageItems.length) % imageItems.length];
    setLightbox(prev);
  };

  const nextItem = () => {
    const imageItems = filtered.filter(m => m.type?.startsWith("image/"));
    const currentIndex = imageItems.findIndex(m => m.url === lightbox.url);
    const next = imageItems[(currentIndex + 1) % imageItems.length];
    setLightbox(next);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  };

  const photoCount = allMedia.filter(m => m.type?.startsWith("image/")).length;
  const videoCount = allMedia.filter(m => m.type?.startsWith("video/")).length;
  const audioCount = allMedia.filter(m => m.type?.startsWith("audio/")).length;

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header} className="fade-in-up">
          <span style={{ fontSize: "2.5rem" }}>🖼️</span>
          <h1 style={styles.pageTitle}>Our Gallery</h1>
          <p style={styles.pageSubtitle} className="text-script">
            "A picture is worth a thousand words, but ours are priceless"
          </p>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          {[
            { label: "Photos", value: photoCount, emoji: "📸", type: "photos" },
            { label: "Videos", value: videoCount, emoji: "🎬", type: "videos" },
            { label: "Audio", value: audioCount, emoji: "🎙️", type: "audio" },
          ].map((stat) => (
            <div
              key={stat.type}
              style={{
                ...styles.statCard,
                ...(filter === stat.type ? styles.statCardActive : {}),
              }}
              onClick={() => setFilter(filter === stat.type ? "all" : stat.type)}
            >
              <span style={styles.statEmoji}>{stat.emoji}</span>
              <span style={styles.statValue}>{stat.value}</span>
              <span style={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterRow}>
          {[
            { key: "all", label: "✨ All Media" },
            { key: "photos", label: "📸 Photos" },
            { key: "videos", label: "🎬 Videos" },
            { key: "audio", label: "🎙️ Audio" },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.filterBtn,
                ...(filter === tab.key ? styles.filterBtnActive : {}),
              }}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Content */}
        {loading ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: "3rem" }}>🌸</span>
            <p style={styles.emptyTitle}>Loading your gallery...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: "3.5rem" }}>🖼️</span>
            <p style={styles.emptyTitle}>No media yet!</p>
            <p style={styles.emptyDesc}>
              {filter === "all"
                ? "Start adding photos and videos to your entries 💕"
                : `No ${filter} found. Try uploading some! 🌸`}
            </p>
            <button style={styles.addBtn} onClick={() => navigate("/new-entry")}>
              ✍️ Add to an Entry
            </button>
          </div>
        ) : (
          <>
            {/* Photos & Videos Grid */}
            {(filter === "all" || filter === "photos" || filter === "videos") && (
              <div style={styles.section}>
                {filter === "all" && (
                  <h2 style={styles.sectionTitle}>📸 Photos & Videos</h2>
                )}
                <div style={styles.photoGrid}>
                  {filtered
                    .filter(m => m.type?.startsWith("image/") || m.type?.startsWith("video/"))
                    .map((item, i) => (
                      <div
                        key={i}
                        style={styles.photoItem}
                        onClick={() => item.type?.startsWith("image/") && openLightbox(item, i)}
                        className="fade-in-up"
                      >
                        {item.type?.startsWith("image/") ? (
                          <>
                            <img
                              src={item.url}
                              alt={item.name || "memory"}
                              style={styles.photo}
                            />
                            <div style={styles.photoOverlay}>
                              <span style={styles.photoOverlayIcon}>🔍</span>
                              {item.entryDate && (
                                <span style={styles.photoDate}>{formatDate(item.entryDate)}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div style={styles.videoThumb}>
                            <video src={item.url} style={styles.photo} />
                            <div style={styles.videoOverlay}>
                              <span style={styles.playIcon}>▶</span>
                            </div>
                          </div>
                        )}

                        {/* Author badge */}
                        <div style={styles.authorBadge}>
                          {MOODS.find(m => m.label === item.mood)?.emoji || "💕"}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Audio Section */}
            {(filter === "all" || filter === "audio") &&
              filtered.filter(m => m.type?.startsWith("audio/")).length > 0 && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>🎙️ Voice Memories</h2>
                <div style={styles.audioList}>
                  {filtered
                    .filter(m => m.type?.startsWith("audio/"))
                    .map((item, i) => (
                      <div key={i} style={styles.audioCard} className="fade-in-up">
                        <div style={styles.audioCardLeft}>
                          <div style={styles.audioIcon}>🎵</div>
                          <div>
                            <p style={styles.audioName}>{item.name || "Voice recording"}</p>
                            <p style={styles.audioMeta}>
                              by {item.authorName} •{" "}
                              {item.entryDate ? formatDate(item.entryDate) : ""}
                            </p>
                          </div>
                        </div>
                        <audio
                          src={item.url}
                          controls
                          style={styles.audioPlayer}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Add media button */}
        {!loading && allMedia.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <button style={styles.addBtn} onClick={() => navigate("/new-entry")}>
              ✍️ Add More Memories
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div style={styles.lightboxOverlay} onClick={closeLightbox}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button style={styles.lightboxClose} onClick={closeLightbox}>✕</button>

            {/* Navigation */}
            <button style={{ ...styles.lightboxNav, left: "16px" }} onClick={prevItem}>‹</button>
            <button style={{ ...styles.lightboxNav, right: "16px" }} onClick={nextItem}>›</button>

            {/* Image */}
            <img
              src={lightbox.url}
              alt={lightbox.name}
              style={styles.lightboxImage}
            />

            {/* Info */}
            <div style={styles.lightboxInfo}>
              {lightbox.entryTitle && (
                <p style={styles.lightboxTitle}>{lightbox.entryTitle}</p>
              )}
              <div style={styles.lightboxMeta}>
                {lightbox.mood && (
                  <span style={styles.lightboxMood}>
                    {MOODS.find(m => m.label === lightbox.mood)?.emoji} {lightbox.mood}
                  </span>
                )}
                {lightbox.entryDate && (
                  <span style={styles.lightboxDate}>📅 {formatDate(lightbox.entryDate)}</span>
                )}
                {lightbox.authorName && (
                  <span style={styles.lightboxAuthor}>💕 {lightbox.authorName}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff0f3 0%, #f5f0ff 50%, #fdf6e3 100%)",
    position: "relative", overflow: "hidden",
  },
  blob1: {
    position: "fixed", width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,182,193,0.25) 0%, transparent 70%)",
    top: "-150px", left: "-100px", pointerEvents: "none", zIndex: 0,
  },
  blob2: {
    position: "fixed", width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(196,167,255,0.2) 0%, transparent 70%)",
    bottom: "-100px", right: "-80px", pointerEvents: "none", zIndex: 0,
  },
  container: {
    maxWidth: "1000px", margin: "0 auto",
    padding: "40px 24px 80px", position: "relative", zIndex: 1,
  },
  header: { textAlign: "center", marginBottom: "32px" },
  pageTitle: {
    fontFamily: "'Dancing Script', cursive", fontSize: "3rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", margin: "8px 0",
  },
  pageSubtitle: {
    color: "#b48aff", fontSize: "1.1rem",
    fontFamily: "'Dancing Script', cursive",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px", marginBottom: "24px",
  },
  statCard: {
    background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
    borderRadius: "20px", padding: "20px 16px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 4px 20px rgba(180,120,140,0.1)",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "6px",
    cursor: "pointer", transition: "all 0.25s ease",
  },
  statCardActive: {
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    border: "1px solid #ffb3c1",
    boxShadow: "0 6px 24px rgba(255,133,161,0.2)",
    transform: "translateY(-2px)",
  },
  statEmoji: { fontSize: "1.8rem" },
  statValue: {
    fontFamily: "'Dancing Script', cursive", fontSize: "2.2rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.78rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif", fontWeight: "600",
  },
  filterRow: {
    display: "flex", gap: "10px", flexWrap: "wrap",
    marginBottom: "28px",
  },
  filterBtn: {
    padding: "10px 20px", borderRadius: "14px",
    border: "1px solid rgba(255,182,193,0.4)",
    background: "rgba(255,255,255,0.8)",
    fontSize: "0.88rem", fontWeight: "600",
    color: "#6b4f4f", fontFamily: "'Nunito', sans-serif",
    cursor: "pointer", transition: "all 0.25s ease",
  },
  filterBtnActive: {
    background: "linear-gradient(135deg, #ff85a1, #b48aff)",
    color: "white", border: "1px solid transparent",
    boxShadow: "0 4px 16px rgba(255,133,161,0.3)",
  },
  section: { marginBottom: "40px" },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem", color: "#3d2c2c",
    marginBottom: "16px",
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "14px",
  },
  photoItem: {
    position: "relative", borderRadius: "18px",
    overflow: "hidden", aspectRatio: "1",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(180,120,140,0.15)",
    border: "2px solid rgba(255,182,193,0.3)",
    transition: "all 0.3s ease",
  },
  photo: {
    width: "100%", height: "100%",
    objectFit: "cover", display: "block",
    transition: "transform 0.3s ease",
  },
  photoOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(61,44,44,0.6) 0%, transparent 60%)",
    opacity: 0, transition: "opacity 0.3s ease",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "8px",
  },
  photoOverlayIcon: { fontSize: "2rem" },
  photoDate: {
    fontSize: "0.75rem", color: "white",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: "600", position: "absolute",
    bottom: "10px", left: "10px",
  },
  videoThumb: { position: "relative", width: "100%", height: "100%" },
  videoOverlay: {
    position: "absolute", inset: 0,
    background: "rgba(61,44,44,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  playIcon: {
    width: "44px", height: "44px", borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.2rem", color: "#ff4d6d",
  },
  authorBadge: {
    position: "absolute", top: "10px", right: "10px",
    width: "32px", height: "32px", borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  audioList: { display: "flex", flexDirection: "column", gap: "12px" },
  audioCard: {
    background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)",
    borderRadius: "20px", padding: "20px 24px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 4px 20px rgba(180,120,140,0.1)",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "20px",
    flexWrap: "wrap",
  },
  audioCardLeft: { display: "flex", alignItems: "center", gap: "14px" },
  audioIcon: {
    width: "48px", height: "48px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.4rem", flexShrink: 0,
  },
  audioName: {
    fontWeight: "700", color: "#3d2c2c",
    fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem",
  },
  audioMeta: {
    fontSize: "0.78rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
  },
  audioPlayer: { flex: 1, minWidth: "200px", maxWidth: "300px" },
  emptyState: {
    textAlign: "center", padding: "80px 24px",
    background: "rgba(255,255,255,0.7)", borderRadius: "24px",
    border: "1px dashed rgba(255,182,193,0.5)",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "12px",
  },
  emptyTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.5rem", color: "#3d2c2c",
  },
  emptyDesc: {
    color: "#9e7676", fontFamily: "'Nunito', sans-serif",
    maxWidth: "300px",
  },
  addBtn: {
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "16px",
    padding: "14px 28px", fontSize: "1rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 8px 24px rgba(255,77,109,0.3)",
    transition: "all 0.3s ease",
  },
  lightboxOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(20,10,15,0.92)", backdropFilter: "blur(12px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 3000, padding: "24px",
  },
  lightboxContent: {
    position: "relative", maxWidth: "800px", width: "100%",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  lightboxClose: {
    position: "absolute", top: "-48px", right: "0",
    background: "rgba(255,255,255,0.15)", border: "none",
    borderRadius: "50%", width: "40px", height: "40px",
    color: "white", fontSize: "1.1rem", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  lightboxNav: {
    position: "absolute", top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.15)", border: "none",
    borderRadius: "50%", width: "48px", height: "48px",
    color: "white", fontSize: "1.8rem", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1, transition: "all 0.2s ease",
  },
  lightboxImage: {
    maxWidth: "100%", maxHeight: "70vh",
    borderRadius: "20px", objectFit: "contain",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
  },
  lightboxInfo: {
    marginTop: "20px", textAlign: "center",
  },
  lightboxTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.3rem", color: "white", marginBottom: "10px",
  },
  lightboxMeta: { display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" },
  lightboxMood: {
    background: "rgba(255,255,255,0.15)", borderRadius: "20px",
    padding: "6px 14px", fontSize: "0.85rem",
    color: "white", fontFamily: "'Nunito', sans-serif",
  },
  lightboxDate: {
    background: "rgba(255,255,255,0.15)", borderRadius: "20px",
    padding: "6px 14px", fontSize: "0.85rem",
    color: "white", fontFamily: "'Nunito', sans-serif",
  },
  lightboxAuthor: {
    background: "rgba(255,255,255,0.15)", borderRadius: "20px",
    padding: "6px 14px", fontSize: "0.85rem",
    color: "white", fontFamily: "'Nunito', sans-serif",
  },
};

// Add hover effects
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  .photo-item:hover .photo { transform: scale(1.05); }
  .photo-item:hover .photo-overlay { opacity: 1 !important; }
`;
document.head.appendChild(styleTag);

export default Gallery;