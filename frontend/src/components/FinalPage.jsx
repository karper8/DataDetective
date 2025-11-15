import React, { useState, useEffect } from "react";

function FinalPage() {
  const team = sessionStorage.getItem("team");

  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [message, setMessage] = useState("");
  const [attemptsList, setAttemptsList] = useState([]);

  // Load stored attempts on page load
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("final_attempts") || "[]");
    setAttemptsList(saved);
  }, []);

  // Convert to IST
  const getIST = () => {
    const now = new Date();
    const offsetIST = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + offsetIST).toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const timestamp = getIST();

    // Create attempt entry
    const attemptEntry = {
      answer1: a1,
      answer2: a2,
      timestamp,
    };

    // Store locally in frontend
    const updatedAttempts = [...attemptsList, attemptEntry];
    setAttemptsList(updatedAttempts);
    sessionStorage.setItem("final_attempts", JSON.stringify(updatedAttempts));

    // Send only latest attempt to backend
    await fetch(`${import.meta.env.VITE_API_BASE}/submit-final`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team,
        answer1: a1,
        answer2: a2,
        attempts: updatedAttempts.length,
        timestamp,
      }),
    });

    setMessage("Final answers submitted!");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>Final Challenge</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Answer 1"
          value={a1}
          onChange={(e) => setA1(e.target.value)}
          style={{ margin: "10px", padding: "8px", width: "300px" }}
        />
        <br />

        <input
          type="text"
          placeholder="Answer 2"
          value={a2}
          onChange={(e) => setA2(e.target.value)}
          style={{ margin: "10px", padding: "8px", width: "300px" }}
        />
        <br />

        <button style={{ padding: "8px 20px", marginTop: "10px" }}>
          Submit Final Answers
        </button>
      </form>

      <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>

      <h3 style={{ marginTop: "40px" }}>📌 Your Attempts</h3>

      {attemptsList.length === 0 ? (
        <p>No attempts yet.</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {attemptsList.map((att, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "10px",
                margin: "10px auto",
                width: "350px",
                background: "#111",
                color: "white",
              }}
            >
              <p><strong>Attempt #{i + 1}</strong></p>
              <p>Answer 1: {att.answer1}</p>
              <p>Answer 2: {att.answer2}</p>
              <p style={{ fontSize: "12px", color: "#bbb" }}>
                {att.timestamp}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FinalPage;