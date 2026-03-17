import React, { useEffect, useState } from "react";

const HEARTS = ["💕", "🌸", "💗", "✨", "🌷", "💝", "🎀", "💖"];

const FloatingHearts = () => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newHeart = {
        id: Date.now(),
        emoji: HEARTS[Math.floor(Math.random() * HEARTS.length)],
        left: Math.random() * 100,
        duration: 6 + Math.random() * 6,
        size: 0.8 + Math.random() * 0.8,
        delay: 0,
      };
      setHearts((prev) => [...prev.slice(-12), newHeart]);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {hearts.map((heart) => (
        <div
          key={heart.id}
          style={{
            ...styles.heart,
            left: `${heart.left}%`,
            fontSize: `${heart.size}rem`,
            animation: `floatUp ${heart.duration}s ease-in forwards`,
          }}
        >
          {heart.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(100vh) scale(0.5); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-20vh) scale(1) rotate(20deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 0,
    overflow: "hidden",
  },
  heart: {
    position: "absolute",
    bottom: "-50px",
    pointerEvents: "none",
    userSelect: "none",
    willChange: "transform",
  },
};

export default FloatingHearts;