import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😢", label: "Missing You" },
  { emoji: "✨", label: "Excited" },
  { emoji: "😌", label: "Peaceful" },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CalendarPage = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [entryMap, setEntryMap] = useState({});
  const [today] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "entries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEntries(data);

      // Build a map: "YYYY-MM-DD" -> [entries]
      const map = {};
      data.forEach((entry) => {
        const dateKey = entry.date || (
          entry.createdAt?.toDate
            ? entry.createdAt.toDate().toISOString().split("T")[0]
            : null
        );
        if (dateKey) {
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push(entry);
        }
      });
      setEntryMap(map);
    });
    return unsubscribe;
  }, []);

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handleDateClick = (day) => {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const dayEntries = entryMap[dateKey] || [];
    setSelectedDate(dateKey);
    setSelectedEntries(dayEntries);
    setShowModal(true);
    setExpandedEntry(null);
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  // Build calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  // Stats
  const totalThisMonth = Object.keys(entryMap).filter(k =>
    k.startsWith(`${currentYear}-${String(currentMonth+1).padStart(2,"0")}`)
  ).reduce((acc, k) => acc + entryMap[k].length, 0);

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header} className="fade-in-up">
          <span style={{ fontSize: "2.5rem" }}>📅</span>
          <h1 style={styles.pageTitle}>Memory Calendar</h1>
          <p style={styles.pageSubtitle} className="text-script">
            "Every date holds a story of us"
          </p>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          {[
            { label: "Total Memories", value: entries.length, emoji: "💝" },
            { label: "This Month", value: totalThisMonth, emoji: "🌸" },
            { label: "Days with Entries", value: Object.keys(entryMap).length, emoji: "✨" },
          ].map((stat) => (
            <div key={stat.label} style={styles.statCard}>
              <span style={styles.statEmoji}>{stat.emoji}</span>
              <span style={styles.statValue}>{stat.value}</span>
              <span style={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Card */}
        <div style={styles.calendarCard}>
          {/* Month Navigation */}
          <div style={styles.monthNav}>
            <button style={styles.navArrow} onClick={prevMonth}>‹</button>
            <div style={styles.monthTitle}>
              <h2 style={styles.monthName}>{MONTHS[currentMonth]}</h2>
              <span style={styles.yearText}>{currentYear}</span>
            </div>
            <button style={styles.navArrow} onClick={nextMonth}>›</button>
          </div>

          {/* Day Headers */}
          <div style={styles.dayHeaders}>
            {DAYS.map((d) => (
              <div key={d} style={styles.dayHeader}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={styles.calendarGrid}>
            {calendarCells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} style={styles.emptyCell} />;

              const dateKey = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const hasEntries = !!entryMap[dateKey];
              const entryCount = entryMap[dateKey]?.length || 0;
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate && showModal;
              const isPast = new Date(dateKey) < today;

              return (
                <button
                  key={dateKey}
                  style={{
                    ...styles.dayCell,
                    ...(isToday ? styles.dayCellToday : {}),
                    ...(hasEntries ? styles.dayCellHasEntry : {}),
                    ...(isSelected ? styles.dayCellSelected : {}),
                    ...(!isPast && !isToday ? styles.dayCellFuture : {}),
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <span style={styles.dayNumber}>{day}</span>
                  {hasEntries && (
                    <div style={styles.entryDots}>
                      {Array.from({ length: Math.min(entryCount, 3) }).map((_, j) => (
                        <div key={j} style={styles.dot} />
                      ))}
                    </div>
                  )}
                  {isToday && <div style={styles.todayBadge}>today</div>}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: "linear-gradient(135deg, #ff85a1, #ff4d6d)" }} />
              <span>Has memories</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: "linear-gradient(135deg, #ffb3c1, #ede0ff)", border: "2px solid #ff4d6d" }} />
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* New Entry Button */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button style={styles.newEntryBtn} onClick={() => navigate("/new-entry")}>
            ✍️ Write Today's Memory
          </button>
        </div>
      </div>

      {/* Day Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => { setShowModal(false); setSelectedDate(null); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => { setShowModal(false); setSelectedDate(null); }}>✕</button>

            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <span style={{ fontSize: "2rem" }}>
                {selectedEntries.length > 0 ? "💝" : "📭"}
              </span>
              <h3 style={styles.modalDate}>{formatDisplayDate(selectedDate)}</h3>
              <p style={styles.modalCount}>
                {selectedEntries.length > 0
                  ? `${selectedEntries.length} memor${selectedEntries.length > 1 ? "ies" : "y"} this day 🌸`
                  : "No memories yet for this day"}
              </p>
            </div>

            <div style={styles.modalDivider} />

            {selectedEntries.length === 0 ? (
              <div style={styles.emptyDay}>
                <p style={styles.emptyDayText}>Nothing written for this day yet 💭</p>
                <button
                  style={styles.addMemoryBtn}
                  onClick={() => { setShowModal(false); navigate("/new-entry"); }}
                >
                  ✍️ Add a Memory
                </button>
              </div>
            ) : (
              <div style={styles.entriesList}>
                {selectedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={styles.entryItem}
                    onClick={() => setExpandedEntry(expandedEntry?.id === entry.id ? null : entry)}
                  >
                    <div style={styles.entryItemHeader}>
                      <div style={styles.entryMoodBadge}>
                        {MOODS.find(m => m.label === entry.mood)?.emoji || "💕"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={styles.entryItemAuthor}>{entry.authorName}</p>
                        <p style={styles.entryItemTime}>{formatTimestamp(entry.createdAt)}</p>
                      </div>
                      {entry.mood && (
                        <div style={styles.moodTag}>
                          {MOODS.find(m => m.label === entry.mood)?.emoji} {entry.mood}
                        </div>
                      )}
                      <span style={styles.expandIcon}>
                        {expandedEntry?.id === entry.id ? "▲" : "▼"}
                      </span>
                    </div>

                    {entry.title && (
                      <h4 style={styles.entryItemTitle}>{entry.title}</h4>
                    )}

                    {/* Expanded content */}
                    {expandedEntry?.id === entry.id && (
                      <div style={styles.expandedContent}>
                        <div style={styles.entryDivider} />
                        <p style={styles.entryFullText}>{entry.text}</p>

                        {/* Media */}
                        {entry.mediaUrls?.length > 0 && (
                          <div style={styles.mediaGrid}>
                            {entry.mediaUrls.map((media, i) => (
                              <div key={i} style={styles.mediaItem}>
                                {media.type?.startsWith("image/") ? (
                                  <img
                                    src={media.url}
                                    alt={media.name}
                                    style={styles.mediaImage}
                                    onClick={(e) => { e.stopPropagation(); window.open(media.url, "_blank"); }}
                                  />
                                ) : media.type?.startsWith("audio/") ? (
                                  <div style={styles.audioItem}>
                                    <span>🎙️</span>
                                    <audio src={media.url} controls style={{ flex: 1 }} />
                                  </div>
                                ) : media.type?.startsWith("video/") ? (
                                  <video
                                    src={media.url}
                                    controls
                                    style={styles.videoItem}
                                  />
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
    maxWidth: "800px", margin: "0 auto",
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
    gap: "16px", marginBottom: "28px",
  },
  statCard: {
    background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
    borderRadius: "20px", padding: "20px 16px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 4px 20px rgba(180,120,140,0.1)",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "6px",
    textAlign: "center",
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
  calendarCard: {
    background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)",
    borderRadius: "28px", padding: "32px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 12px 48px rgba(180,120,140,0.12)",
  },
  monthNav: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: "28px",
  },
  navArrow: {
    width: "44px", height: "44px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    border: "none", fontSize: "1.6rem", color: "#6b4f4f",
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontWeight: "700", transition: "all 0.25s ease",
    boxShadow: "0 2px 12px rgba(255,133,161,0.2)",
  },
  monthTitle: { textAlign: "center" },
  monthName: {
    fontFamily: "'Dancing Script', cursive", fontSize: "2.2rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", lineHeight: 1,
  },
  yearText: {
    fontSize: "1rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif", fontWeight: "600",
  },
  dayHeaders: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px", marginBottom: "8px",
  },
  dayHeader: {
    textAlign: "center", fontSize: "0.78rem",
    fontWeight: "700", color: "#b48aff",
    fontFamily: "'Nunito', sans-serif",
    padding: "8px 0",
  },
  calendarGrid: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
    gap: "6px",
  },
  emptyCell: { height: "64px" },
  dayCell: {
    height: "64px", borderRadius: "14px",
    background: "#fff8fa", border: "1px solid #ffe4e8",
    cursor: "pointer", position: "relative",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "4px", transition: "all 0.25s ease",
    fontFamily: "'Nunito', sans-serif",
  },
  dayCellToday: {
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    border: "2px solid #ff85a1",
    boxShadow: "0 4px 16px rgba(255,133,161,0.25)",
  },
  dayCellHasEntry: {
    background: "linear-gradient(135deg, #fff0f3, #f5f0ff)",
    border: "1px solid #ffb3c1",
    boxShadow: "0 2px 12px rgba(255,133,161,0.15)",
  },
  dayCellSelected: {
    background: "linear-gradient(135deg, #ff85a1, #b48aff)",
    border: "2px solid #ff4d6d",
    boxShadow: "0 6px 20px rgba(255,77,109,0.3)",
    transform: "scale(1.05)",
  },
  dayCellFuture: { opacity: 0.5 },
  dayNumber: {
    fontSize: "0.9rem", fontWeight: "700",
    color: "#3d2c2c",
  },
  entryDots: { display: "flex", gap: "3px" },
  dot: {
    width: "5px", height: "5px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ff85a1, #b48aff)",
  },
  todayBadge: {
    position: "absolute", bottom: "4px",
    fontSize: "0.55rem", fontWeight: "700",
    color: "#ff4d6d", fontFamily: "'Nunito', sans-serif",
    letterSpacing: "0.5px",
  },
  legend: {
    display: "flex", gap: "20px",
    justifyContent: "center", marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255,182,193,0.2)",
  },
  legendItem: {
    display: "flex", alignItems: "center", gap: "8px",
    fontSize: "0.8rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
  },
  legendDot: { width: "12px", height: "12px", borderRadius: "50%" },
  newEntryBtn: {
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "16px",
    padding: "14px 32px", fontSize: "1rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 8px 24px rgba(255,77,109,0.3)",
    transition: "all 0.3s ease",
  },
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(61,44,44,0.45)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2000, padding: "24px",
  },
  modal: {
    background: "white", borderRadius: "32px",
    padding: "36px", maxWidth: "560px", width: "100%",
    maxHeight: "80vh", overflowY: "auto",
    position: "relative",
    boxShadow: "0 24px 64px rgba(180,120,140,0.25)",
    border: "1px solid rgba(255,182,193,0.4)",
  },
  modalClose: {
    position: "absolute", top: "20px", right: "20px",
    background: "#fff0f3", border: "none", borderRadius: "50%",
    width: "36px", height: "36px", fontSize: "1rem",
    cursor: "pointer", color: "#6b4f4f", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modalHeader: { textAlign: "center", marginBottom: "16px" },
  modalDate: {
    fontFamily: "'Playfair Display', serif", fontSize: "1.4rem",
    color: "#3d2c2c", margin: "8px 0 4px",
  },
  modalCount: {
    fontSize: "0.88rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
  },
  modalDivider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, #ffb3c1, transparent)",
    margin: "16px 0",
  },
  emptyDay: { textAlign: "center", padding: "24px 0" },
  emptyDayText: {
    color: "#9e7676", fontFamily: "'Nunito', sans-serif",
    marginBottom: "16px", fontSize: "0.95rem",
  },
  addMemoryBtn: {
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "14px",
    padding: "12px 24px", fontSize: "0.95rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 6px 20px rgba(255,77,109,0.25)",
  },
  entriesList: { display: "flex", flexDirection: "column", gap: "12px" },
  entryItem: {
    background: "#fff8fa", borderRadius: "18px",
    padding: "18px", border: "1px solid #ffe4e8",
    cursor: "pointer", transition: "all 0.25s ease",
  },
  entryItemHeader: {
    display: "flex", alignItems: "center",
    gap: "12px",
  },
  entryMoodBadge: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "1.2rem", flexShrink: 0,
  },
  entryItemAuthor: {
    fontWeight: "700", color: "#3d2c2c",
    fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem",
  },
  entryItemTime: {
    fontSize: "0.75rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
  },
  moodTag: {
    display: "inline-flex", alignItems: "center", gap: "4px",
    background: "#fff0f3", border: "1px solid #ffb3c1",
    borderRadius: "20px", padding: "3px 10px",
    fontSize: "0.75rem", color: "#c9184a",
    fontFamily: "'Nunito', sans-serif", fontWeight: "600",
    whiteSpace: "nowrap",
  },
  expandIcon: { fontSize: "0.7rem", color: "#9e7676" },
  entryItemTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1rem", color: "#3d2c2c",
    marginTop: "10px",
  },
  expandedContent: { marginTop: "12px" },
  entryDivider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, #ffb3c1, transparent)",
    margin: "12px 0",
  },
  entryFullText: {
    fontSize: "0.9rem", color: "#6b4f4f",
    fontFamily: "'Nunito', sans-serif",
    lineHeight: "1.8", whiteSpace: "pre-wrap",
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "10px", marginTop: "14px",
  },
  mediaItem: { borderRadius: "12px", overflow: "hidden" },
  mediaImage: {
    width: "100%", height: "100px",
    objectFit: "cover", cursor: "pointer",
    transition: "transform 0.2s ease",
  },
  audioItem: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px", background: "#fff0f3",
    borderRadius: "12px",
  },
  videoItem: {
    width: "100%", borderRadius: "12px",
    maxHeight: "200px",
  },
};

export default CalendarPage;