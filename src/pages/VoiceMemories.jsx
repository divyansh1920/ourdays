import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const VoiceMemories = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [audioEntries, setAudioEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [visualizerBars, setVisualizerBars] = useState(Array(20).fill(4));

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "voiceMemories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAudioEntries(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Visualizer setup
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const animateVisualizer = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const bars = Array.from({ length: 20 }, (_, i) => {
          const value = dataArray[Math.floor((i / 20) * dataArray.length)];
          return Math.max(4, (value / 255) * 60);
        });
        setVisualizerBars(bars);
        animFrameRef.current = requestAnimationFrame(animateVisualizer);
      };
      animateVisualizer();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        cancelAnimationFrame(animFrameRef.current);
        setVisualizerBars(Array(20).fill(4));
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access 🎙️");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingTitle("");
    setRecordingTime(0);
  };

  const saveRecording = async () => {
    if (!audioBlob) return;
    setUploading(true);

    try {
      const fileName = `voice_${Date.now()}.webm`;
      const storageRef = ref(storage, `voiceMemories/${currentUser.uid}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, audioBlob);

      await new Promise((resolve, reject) => {
        uploadTask.on("state_changed", null, reject, resolve);
      });

      const url = await getDownloadURL(uploadTask.snapshot.ref);

      const { addDoc, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "voiceMemories"), {
        url,
        title: recordingTitle.trim() || "A voice memory",
        duration: recordingTime,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split("T")[0],
      });

      setUploadSuccess(true);
      discardRecording();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save recording 😢 Please try again.");
    }

    setUploading(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header} className="fade-in-up">
          <span style={{ fontSize: "2.5rem" }}>🎙️</span>
          <h1 style={styles.pageTitle}>Voice Memories</h1>
          <p style={styles.pageSubtitle} className="text-script">
            "The sound of your voice is my favourite song"
          </p>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={{ fontSize: "1.8rem" }}>🎵</span>
            <span style={styles.statValue}>{audioEntries.length}</span>
            <span style={styles.statLabel}>Voice Memories</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ fontSize: "1.8rem" }}>⏱️</span>
            <span style={styles.statValue}>
              {formatTime(audioEntries.reduce((acc, e) => acc + (e.duration || 0), 0))}
            </span>
            <span style={styles.statLabel}>Total Duration</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ fontSize: "1.8rem" }}>💕</span>
            <span style={styles.statValue}>
              {[...new Set(audioEntries.map((e) => e.authorName))].length}
            </span>
            <span style={styles.statLabel}>Voices Recorded</span>
          </div>
        </div>

        {/* Recorder Card */}
        <div style={styles.recorderCard}>
          <h2 style={styles.recorderTitle}>Record a New Memory 🎙️</h2>
          <p style={styles.recorderSubtitle}>
            Say something sweet — your voice will be saved forever 💕
          </p>

          {/* Visualizer */}
          <div style={styles.visualizer}>
            {visualizerBars.map((height, i) => (
              <div
                key={i}
                style={{
                  ...styles.visualizerBar,
                  height: `${height}px`,
                  background: recording
                    ? `linear-gradient(to top, #ff4d6d, #b48aff)`
                    : "linear-gradient(to top, #ffb3c1, #ede0ff)",
                  transition: recording ? "height 0.1s ease" : "height 0.5s ease",
                }}
              />
            ))}
          </div>

          {/* Timer */}
          {(recording || audioBlob) && (
            <div style={styles.timerDisplay}>
              <div style={{ ...styles.timerDot, background: recording ? "#ff4d6d" : "#b48aff" }} />
              <span style={styles.timerText}>
                {recording ? `Recording... ${formatTime(recordingTime)}` : `Recorded: ${formatTime(recordingTime)}`}
              </span>
            </div>
          )}

          {/* Controls */}
          {!audioBlob ? (
            <div style={styles.controls}>
              {!recording ? (
                <button style={styles.recordBtn} onClick={startRecording}>
                  <span style={styles.recordBtnInner}>🎙️</span>
                  <span>Start Recording</span>
                </button>
              ) : (
                <button style={styles.stopBtn} onClick={stopRecording}>
                  <span style={styles.stopBtnInner}>⬛</span>
                  <span>Stop Recording</span>
                </button>
              )}
            </div>
          ) : (
            <div style={styles.previewSection}>
              {/* Title input */}
              <input
                type="text"
                placeholder="Give this memory a title... 💕"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                style={styles.titleInput}
              />

              {/* Audio preview */}
              <div style={styles.audioPreview}>
                <span style={{ fontSize: "1.5rem" }}>🎵</span>
                <audio src={audioPreviewUrl} controls style={{ flex: 1 }} />
              </div>

              {/* Action buttons */}
              <div style={styles.previewBtns}>
                <button style={styles.discardBtn} onClick={discardRecording}>
                  🗑️ Discard
                </button>
                <button
                  style={{ ...styles.saveBtn, opacity: uploading ? 0.7 : 1 }}
                  onClick={saveRecording}
                  disabled={uploading}
                >
                  {uploading ? "Saving... 🌸" : "💾 Save Memory"}
                </button>
              </div>
            </div>
          )}

          {/* Success message */}
          {uploadSuccess && (
            <div style={styles.successMsg}>
              🌸 Voice memory saved! You can hear it below 💕
            </div>
          )}
        </div>

        {/* Saved Voice Memories */}
        <div style={styles.memoriesSection}>
          <h2 style={styles.sectionTitle}>Saved Voice Memories 💝</h2>

          {loading ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: "2rem" }}>🌸</span>
              <p>Loading your voice memories...</p>
            </div>
          ) : audioEntries.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: "3.5rem" }}>🎙️</span>
              <p style={styles.emptyTitle}>No voice memories yet!</p>
              <p style={styles.emptyDesc}>
                Record your first voice message above 💕
              </p>
            </div>
          ) : (
            <div style={styles.memoriesList}>
              {audioEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    ...styles.memoryCard,
                    ...(currentlyPlaying === entry.id ? styles.memoryCardActive : {}),
                  }}
                  className="fade-in-up"
                >
                  {/* Left side */}
                  <div style={styles.memoryLeft}>
                    <div style={styles.memoryIconWrap}>
                      <span style={styles.memoryIcon}>🎵</span>
                      {currentlyPlaying === entry.id && (
                        <div style={styles.playingRing} />
                      )}
                    </div>
                    <div style={styles.memoryInfo}>
                      <h3 style={styles.memoryTitle}>{entry.title}</h3>
                      <div style={styles.memoryMeta}>
                        <span style={styles.memoryAuthor}>💕 {entry.authorName}</span>
                        <span style={styles.memoryDot}>·</span>
                        <span style={styles.memoryDate}>
                          {entry.date ? formatDate(entry.date) : ""}
                        </span>
                        {entry.duration && (
                          <>
                            <span style={styles.memoryDot}>·</span>
                            <span style={styles.memoryDuration}>
                              ⏱️ {formatTime(entry.duration)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Audio player */}
                  <div style={styles.memoryPlayer}>
                    <audio
                      src={entry.url}
                      controls
                      style={styles.audioControl}
                      onPlay={() => setCurrentlyPlaying(entry.id)}
                      onPause={() => setCurrentlyPlaying(null)}
                      onEnded={() => setCurrentlyPlaying(null)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom button */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button style={styles.backBtn} onClick={() => navigate("/")}>
            🏡 Back to Home
          </button>
        </div>

      </div>
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
    alignItems: "center", gap: "6px", textAlign: "center",
  },
  statValue: {
    fontFamily: "'Dancing Script', cursive", fontSize: "2rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.78rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif", fontWeight: "600",
  },
  recorderCard: {
    background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)",
    borderRadius: "28px", padding: "36px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 12px 48px rgba(180,120,140,0.12)",
    marginBottom: "32px", textAlign: "center",
  },
  recorderTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.6rem", color: "#3d2c2c", marginBottom: "8px",
  },
  recorderSubtitle: {
    color: "#9e7676", fontFamily: "'Nunito', sans-serif",
    fontSize: "0.9rem", marginBottom: "28px",
  },
  visualizer: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "4px", height: "80px", marginBottom: "20px",
  },
  visualizerBar: {
    width: "8px", borderRadius: "4px",
    minHeight: "4px",
  },
  timerDisplay: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "10px", marginBottom: "20px",
  },
  timerDot: {
    width: "10px", height: "10px", borderRadius: "50%",
    animation: "pulse-soft 1.5s infinite",
  },
  timerText: {
    fontFamily: "'Nunito', sans-serif", fontWeight: "700",
    color: "#3d2c2c", fontSize: "1rem",
  },
  controls: { display: "flex", justifyContent: "center" },
  recordBtn: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "10px",
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "50%",
    width: "100px", height: "100px", cursor: "pointer",
    boxShadow: "0 8px 32px rgba(255,77,109,0.4)",
    transition: "all 0.3s ease", fontSize: "0.78rem",
    fontWeight: "700", fontFamily: "'Nunito', sans-serif",
  },
  recordBtnInner: { fontSize: "2rem" },
  stopBtn: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "10px",
    background: "linear-gradient(135deg, #b48aff, #9b5de5)",
    color: "white", border: "none", borderRadius: "50%",
    width: "100px", height: "100px", cursor: "pointer",
    boxShadow: "0 8px 32px rgba(155,93,229,0.4)",
    transition: "all 0.3s ease", fontSize: "0.78rem",
    fontWeight: "700", fontFamily: "'Nunito', sans-serif",
  },
  stopBtnInner: { fontSize: "1.5rem" },
  previewSection: {
    display: "flex", flexDirection: "column", gap: "16px",
    alignItems: "stretch",
  },
  titleInput: {
    padding: "14px 18px", borderRadius: "14px",
    border: "2px solid #ffe4e8", fontSize: "0.95rem",
    fontFamily: "'Nunito', sans-serif",
    background: "#fffdf7", color: "#3d2c2c",
    outline: "none", textAlign: "center",
    transition: "border-color 0.3s ease",
  },
  audioPreview: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "#fff0f3", borderRadius: "14px", padding: "14px",
    border: "1px solid #ffb3c1",
  },
  previewBtns: { display: "flex", gap: "12px" },
  discardBtn: {
    flex: 1, background: "rgba(255,255,255,0.8)",
    border: "1px solid rgba(255,182,193,0.5)",
    borderRadius: "14px", padding: "12px",
    fontSize: "0.95rem", fontWeight: "600",
    color: "#6b4f4f", fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
  },
  saveBtn: {
    flex: 2, background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "14px",
    padding: "12px", fontSize: "0.95rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 6px 20px rgba(255,77,109,0.3)",
    transition: "all 0.3s ease",
  },
  successMsg: {
    marginTop: "16px", background: "#f0fff4",
    border: "1px solid #b3ffcc", borderRadius: "14px",
    padding: "14px", fontSize: "0.9rem",
    color: "#2d7a4f", fontFamily: "'Nunito', sans-serif",
    fontWeight: "600",
  },
  memoriesSection: { marginBottom: "32px" },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.8rem", color: "#3d2c2c", marginBottom: "20px",
  },
  memoriesList: { display: "flex", flexDirection: "column", gap: "14px" },
  memoryCard: {
    background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)",
    borderRadius: "22px", padding: "22px 24px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 4px 20px rgba(180,120,140,0.1)",
    display: "flex", alignItems: "center",
    gap: "20px", flexWrap: "wrap",
    transition: "all 0.3s ease",
  },
  memoryCardActive: {
    border: "1px solid #ffb3c1",
    boxShadow: "0 8px 32px rgba(255,133,161,0.2)",
    background: "linear-gradient(135deg, rgba(255,240,243,0.95), rgba(245,240,255,0.95))",
  },
  memoryLeft: { display: "flex", alignItems: "center", gap: "14px", flex: 1 },
  memoryIconWrap: { position: "relative", flexShrink: 0 },
  memoryIcon: {
    width: "52px", height: "52px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.4rem",
  },
  playingRing: {
    position: "absolute", inset: "-4px", borderRadius: "50%",
    border: "2px solid #ff85a1",
    animation: "pulse-soft 1.5s infinite",
  },
  memoryInfo: { flex: 1 },
  memoryTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1rem", color: "#3d2c2c", marginBottom: "6px",
  },
  memoryMeta: {
    display: "flex", alignItems: "center",
    gap: "6px", flexWrap: "wrap",
  },
  memoryAuthor: {
    fontSize: "0.78rem", color: "#ff4d6d",
    fontFamily: "'Nunito', sans-serif", fontWeight: "600",
  },
  memoryDot: { color: "#d4b8b8", fontSize: "0.7rem" },
  memoryDate: {
    fontSize: "0.78rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
  },
  memoryDuration: {
    fontSize: "0.78rem", color: "#b48aff",
    fontFamily: "'Nunito', sans-serif",
  },
  memoryPlayer: { display: "flex", alignItems: "center" },
  audioControl: { width: "220px" },
  emptyState: {
    textAlign: "center", padding: "60px 24px",
    background: "rgba(255,255,255,0.7)", borderRadius: "24px",
    border: "1px dashed rgba(255,182,193,0.5)",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "12px",
  },
  emptyTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.4rem", color: "#3d2c2c",
  },
  emptyDesc: {
    color: "#9e7676", fontFamily: "'Nunito', sans-serif",
  },
  backBtn: {
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(255,182,193,0.4)",
    borderRadius: "16px", padding: "14px 32px",
    fontSize: "1rem", fontWeight: "700",
    color: "#6b4f4f", fontFamily: "'Nunito', sans-serif",
    cursor: "pointer", transition: "all 0.3s ease",
  },
};

export default VoiceMemories;