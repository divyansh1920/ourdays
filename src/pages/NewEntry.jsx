import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😢", label: "Missing You" },
  { emoji: "✨", label: "Excited" },
  { emoji: "😌", label: "Peaceful" },
];

const NewEntry = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState(location.state?.mood || "");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = fileArray.filter((f) => {
      const isValid = f.type.startsWith("image/") ||
        f.type.startsWith("video/") ||
        f.type.startsWith("audio/") ||
        f.type === "image/gif";
      return isValid && f.size < 50 * 1024 * 1024;
    });

    setFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      if (file.type.startsWith("image/") || file.type === "image/gif") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prev) => [...prev, { url: e.target.result, type: "image", name: file.name }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        setPreviews((prev) => [...prev, { url: null, type: "video", name: file.name }]);
      } else if (file.type.startsWith("audio/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prev) => [...prev, { url: e.target.result, type: "audio", name: file.name }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const storageRef = ref(storage, `entries/${currentUser.uid}/${Date.now()}_${file.name}`);
      await new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = ((i / files.length) + (snapshot.bytesTransferred / snapshot.totalBytes / files.length)) * 100;
            setUploadProgress(Math.round(progress));
          },
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            urls.push({ url, type: file.type, name: file.name });
            resolve();
          }
        );
      });
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) {
      setError("Please write something or add a photo 💕");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const mediaUrls = await uploadFiles();
      await addDoc(collection(db, "entries"), {
        title: title.trim(),
        text: text.trim(),
        mood: selectedMood,
        mediaUrls,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split("T")[0],
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError("Something went wrong. Please try again 🌸");
      console.error(err);
    }

    setUploading(false);
  };

  if (success) {
    return (
      <div style={styles.successPage}>
        <div style={styles.successCard}>
          <div style={styles.successEmoji} className="pulse-soft">🌸</div>
          <h2 style={styles.successTitle}>Memory Saved!</h2>
          <p style={styles.successText}>Your moment has been captured forever 💕</p>
          <div style={styles.successHearts}>
            {["💕", "🌸", "💝", "✨", "🌷"].map((h, i) => (
              <span key={i} style={{ fontSize: "1.8rem", animationDelay: `${i * 0.2}s` }} className="float-animation">{h}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header} className="fade-in-up">
          <button style={styles.backBtn} onClick={() => navigate("/")}>← Back</button>
          <div style={styles.headerCenter}>
            <span style={{ fontSize: "2.5rem" }}>✍️</span>
            <h1 style={styles.pageTitle}>Today's Memory</h1>
            <p style={styles.pageSubtitle} className="text-script">
              "Capture this moment before it becomes yesterday"
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Mood Selector */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>How are you feeling? 🌈</h3>
            <div style={styles.moodGrid}>
              {MOODS.map((mood) => (
                <button
                  key={mood.label}
                  type="button"
                  style={{
                    ...styles.moodBtn,
                    ...(selectedMood === mood.label ? styles.moodBtnActive : {}),
                  }}
                  onClick={() => setSelectedMood(selectedMood === mood.label ? "" : mood.label)}
                >
                  <span style={styles.moodEmoji}>{mood.emoji}</span>
                  <span style={styles.moodLabel}>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Give this memory a title ✨</h3>
            <input
              type="text"
              placeholder="e.g. A lazy Sunday morning..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.titleInput}
            />
          </div>

          {/* Text Entry */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Write your heart out 💕</h3>
            <textarea
              placeholder="Tell me about your day... what made you smile? what made you think of me? anything and everything 🌸"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={styles.textarea}
              rows={8}
            />
            <p style={styles.charCount}>{text.length} characters</p>
          </div>

          {/* Media Upload */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Add photos, videos or audio 📎</h3>
            <p style={styles.cardSubtitle}>Images, GIFs, short videos, voice recordings — max 50MB each</p>

            {/* Drop Zone */}
            <div
              style={{
                ...styles.dropZone,
                ...(dragOver ? styles.dropZoneActive : {}),
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <span style={{ fontSize: "2.5rem" }}>📁</span>
              <p style={styles.dropText}>
                {dragOver ? "Drop it here! 🌸" : "Click or drag & drop files here"}
              </p>
              <p style={styles.dropSubtext}>Photos • Videos • GIFs • Audio</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </div>

            {/* Previews */}
            {previews.length > 0 && (
              <div style={styles.previewGrid}>
                {previews.map((preview, i) => (
                  <div key={i} style={styles.previewItem}>
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => removeFile(i)}
                    >✕</button>

                    {preview.type === "image" && (
                      <img
                        src={preview.url}
                        alt={preview.name}
                        style={styles.previewImage}
                      />
                    )}
                    {preview.type === "video" && (
                      <div style={styles.previewVideo}>
                        <span style={{ fontSize: "2rem" }}>🎬</span>
                        <p style={styles.previewName}>{preview.name}</p>
                      </div>
                    )}
                    {preview.type === "audio" && (
                      <div style={styles.previewAudio}>
                        <span style={{ fontSize: "1.5rem" }}>🎙️</span>
                        <audio src={preview.url} controls style={{ width: "100%", marginTop: "8px" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div style={styles.progressCard}>
              <p style={styles.progressText}>
                {uploadProgress < 100 ? `Saving your memory... ${uploadProgress}% 🌸` : "Almost done! 💕"}
              </p>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>⚠️ {error}</div>
          )}

          {/* Submit */}
          <div style={styles.submitRow}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              style={{ ...styles.submitBtn, opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? "Saving... 🌸" : "Save This Memory 💝"}
            </button>
          </div>

        </form>
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
    maxWidth: "720px", margin: "0 auto",
    padding: "40px 24px 80px", position: "relative", zIndex: 1,
  },
  header: { marginBottom: "36px" },
  backBtn: {
    background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,182,193,0.4)",
    borderRadius: "12px", padding: "8px 16px",
    fontSize: "0.9rem", fontWeight: "600", color: "#6b4f4f",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    marginBottom: "24px", display: "inline-block",
  },
  headerCenter: { textAlign: "center" },
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
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  card: {
    background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)",
    borderRadius: "24px", padding: "28px",
    border: "1px solid rgba(255,182,193,0.3)",
    boxShadow: "0 8px 32px rgba(180,120,140,0.1)",
  },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.15rem", color: "#3d2c2c", marginBottom: "6px",
  },
  cardSubtitle: {
    fontSize: "0.83rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif", marginBottom: "16px",
  },
  moodGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px", marginTop: "14px",
  },
  moodBtn: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "6px", padding: "14px 10px", borderRadius: "16px",
    background: "#fff0f3", border: "2px solid #ffe4e8",
    cursor: "pointer", transition: "all 0.25s ease",
  },
  moodBtnActive: {
    background: "linear-gradient(135deg, #ffe4e8, #ede0ff)",
    border: "2px solid #ffb3c1",
    boxShadow: "0 4px 16px rgba(255,133,161,0.25)",
    transform: "scale(1.05)",
  },
  moodEmoji: { fontSize: "1.8rem" },
  moodLabel: {
    fontSize: "0.78rem", fontWeight: "600",
    color: "#6b4f4f", fontFamily: "'Nunito', sans-serif",
  },
  titleInput: {
    width: "100%", padding: "14px 18px",
    borderRadius: "14px", border: "2px solid #ffe4e8",
    fontSize: "1rem", fontFamily: "'Nunito', sans-serif",
    background: "#fffdf7", color: "#3d2c2c",
    outline: "none", marginTop: "10px",
    transition: "border-color 0.3s ease",
  },
  textarea: {
    width: "100%", padding: "16px 18px",
    borderRadius: "14px", border: "2px solid #ffe4e8",
    fontSize: "0.95rem", fontFamily: "'Nunito', sans-serif",
    background: "#fffdf7", color: "#3d2c2c",
    outline: "none", resize: "vertical", lineHeight: "1.8",
    marginTop: "10px", transition: "border-color 0.3s ease",
  },
  charCount: {
    textAlign: "right", fontSize: "0.78rem",
    color: "#b48aff", fontFamily: "'Nunito', sans-serif",
    marginTop: "8px",
  },
  dropZone: {
    border: "2px dashed #ffb3c1", borderRadius: "18px",
    padding: "40px 20px", textAlign: "center",
    cursor: "pointer", transition: "all 0.3s ease",
    background: "#fff8fa", marginTop: "10px",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "8px",
  },
  dropZoneActive: {
    border: "2px dashed #ff4d6d",
    background: "#fff0f3",
    transform: "scale(1.02)",
  },
  dropText: {
    fontFamily: "'Nunito', sans-serif", fontWeight: "700",
    color: "#6b4f4f", fontSize: "1rem",
  },
  dropSubtext: {
    fontSize: "0.82rem", color: "#9e7676",
    fontFamily: "'Nunito', sans-serif",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px", marginTop: "16px",
  },
  previewItem: {
    position: "relative", borderRadius: "14px",
    overflow: "hidden", border: "2px solid #ffe4e8",
    background: "#fff8fa",
  },
  removeBtn: {
    position: "absolute", top: "6px", right: "6px",
    width: "24px", height: "24px", borderRadius: "50%",
    background: "rgba(255,77,109,0.9)", border: "none",
    color: "white", fontSize: "0.7rem", fontWeight: "700",
    cursor: "pointer", zIndex: 1, display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  previewImage: {
    width: "100%", height: "120px",
    objectFit: "cover", display: "block",
  },
  previewVideo: {
    height: "120px", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "8px",
  },
  previewName: {
    fontSize: "0.75rem", color: "#6b4f4f",
    fontFamily: "'Nunito', sans-serif",
    padding: "0 8px", textAlign: "center",
    overflow: "hidden", textOverflow: "ellipsis",
    whiteSpace: "nowrap", width: "100%",
  },
  previewAudio: {
    padding: "12px", display: "flex",
    flexDirection: "column", alignItems: "center",
  },
  progressCard: {
    background: "rgba(255,255,255,0.9)", borderRadius: "20px",
    padding: "24px", border: "1px solid rgba(255,182,193,0.3)",
  },
  progressText: {
    fontFamily: "'Nunito', sans-serif", fontWeight: "600",
    color: "#6b4f4f", marginBottom: "12px", textAlign: "center",
  },
  progressBar: {
    height: "10px", background: "#ffe4e8",
    borderRadius: "10px", overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ff85a1, #b48aff)",
    borderRadius: "10px", transition: "width 0.3s ease",
  },
  errorBox: {
    background: "#fff0f0", border: "1px solid #ffb3b3",
    borderRadius: "14px", padding: "14px 18px",
    fontSize: "0.9rem", color: "#c9184a",
    fontFamily: "'Nunito', sans-serif",
  },
  submitRow: {
    display: "flex", gap: "14px",
    justifyContent: "flex-end", marginTop: "8px",
  },
  cancelBtn: {
    background: "rgba(255,255,255,0.8)",
    border: "1px solid rgba(255,182,193,0.5)",
    borderRadius: "14px", padding: "14px 28px",
    fontSize: "0.95rem", fontWeight: "600",
    color: "#6b4f4f", fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #ff85a1, #ff4d6d)",
    color: "white", border: "none", borderRadius: "14px",
    padding: "14px 32px", fontSize: "1rem", fontWeight: "700",
    fontFamily: "'Nunito', sans-serif", cursor: "pointer",
    boxShadow: "0 8px 24px rgba(255,77,109,0.3)",
    transition: "all 0.3s ease",
  },
  successPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff0f3, #f5f0ff)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  successCard: {
    background: "white", borderRadius: "32px",
    padding: "60px 48px", textAlign: "center",
    boxShadow: "0 20px 60px rgba(255,133,161,0.2)",
    border: "1px solid rgba(255,182,193,0.4)",
  },
  successEmoji: { fontSize: "4rem", display: "block", marginBottom: "20px" },
  successTitle: {
    fontFamily: "'Dancing Script', cursive", fontSize: "3rem",
    background: "linear-gradient(135deg, #ff4d6d, #9b5de5)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", marginBottom: "12px",
  },
  successText: {
    color: "#9e7676", fontFamily: "'Nunito', sans-serif",
    fontSize: "1rem", marginBottom: "28px",
  },
  successHearts: { display: "flex", gap: "16px", justifyContent: "center" },
};

export default NewEntry;