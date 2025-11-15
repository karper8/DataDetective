import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ✅ Replace these SHA-256 values with your real hashes
const levelAnswers = {
  1: "52d1316b10241a7cce13ac19ecdc883d17503fa67c1920832675c2e9b3629c1f",
  2: "4d7bb379992335c3040dfa87e6cbbdd39c63c12d44fd6c556baa4bcccf0ed9c6",
  3: "51e2a46721d104d9148d85b617833e7745fdbd6795cb0b502a5b6ea31d33378e",
};

// Helper: compute SHA-256 hash for text (browser-safe)
async function sha256(text) {
  const msgUint8 = new TextEncoder().encode(text.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function LevelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const team = sessionStorage.getItem("team");

  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");

  // Determine current level from pathname
  const path = location.pathname; // e.g. "/level1"
  const currentLevel = parseInt(path.replace("/level", ""));
  const levelKey = currentLevel;

  // Placeholder questions — replace with your actual ones
  const questions = {
    1: "Who accessed the Server Room outside shift hours multiple times on 09-11-2025?",
    2: "Which device was associated with unusually large transfers around the breach time?",
    3: "To which city was the shipment containing the stolen device sent?",
  };

  useEffect(() => {
    if (!team) navigate("/");
  }, [team, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!answer.trim()) {
      setMessage("Please enter an answer before submitting.");
      return;
    }

    const normalized = answer.trim().toLowerCase();
    const hashedInput = await sha256(normalized);
    const correctHash = levelAnswers[levelKey];

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (hashedInput === correctHash) {
      setMessage("✅ Correct! Moving to the next level...");
      const timestamp = new Date().toISOString();

      try {
        await fetch(`${import.meta.env.VITE_API_BASE}/submit-level`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team,
            level: currentLevel,
            answer: normalized,
            attempts: newAttempts,
            timestamp,
          }),
        });
      } catch (err) {
        console.error("Error submitting level:", err);
      }

      // ✅ Reset for next level
      setTimeout(() => {
        setAnswer("");
        setAttempts(0);
        setMessage("");

        if (currentLevel < 3) navigate(`/level${currentLevel + 1}`);
        else navigate("/final");
      }, 1000);
    } else {
      setMessage("❌ Incorrect! Try again.");
    }
  };

  // ✅ Fixed Download Dataset functionality
  const handleDownload = () => {
    // Directly use the currentLevel to access backend
    window.open(`${import.meta.env.VITE_API_BASE}/download/${currentLevel}`, "_blank");
  };

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "#0a0f1a",
        color: "white",
        textAlign: "center",
        minHeight: "100vh",
        fontFamily: "'Courier Prime', monospace",
      }}
    >
      <h2 style={{ color: "#00b4d8" }}>Level {currentLevel}</h2>
      <p
        style={{
          margin: "1.5rem auto",
          width: "80%",
          fontSize: "1.1rem",
          lineHeight: "1.8",
        }}
      >
        {questions[levelKey]}
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          style={{
            padding: "0.6rem 1rem",
            width: "50%",
            fontSize: "1rem",
            borderRadius: "6px",
            border: "1px solid #1e293b",
            backgroundColor: "#161b22",
            color: "#e5e7eb",
          }}
        />
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <button
            type="submit"
            style={{
              backgroundColor: "#00b4d8",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "0.6rem 1.5rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleDownload}
            style={{
              backgroundColor: "#00b4d8",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "0.6rem 1.5rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Download Dataset
          </button>
        </div>
      </form>

      <p style={{ marginTop: "1rem", fontSize: "1.1rem" }}>{message}</p>
      <p style={{ fontSize: "0.9rem", color: "#aaa" }}>
        Attempts for this level: {attempts}
      </p>
    </div>
  );
}

export default LevelPage;
