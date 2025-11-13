import React, { useState } from "react";

function FinalPage() {
  const team = sessionStorage.getItem("team");
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Convert to IST
    const now = new Date();
    const offsetIST = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + offsetIST).toISOString();

    try {
      await fetch(`${import.meta.env.VITE_API_BASE}/submit-final`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          answer1: a1,
          answer2: a2,
          attempts: newAttempts,
          timestamp: istTime,
        }),
      });

      setMessage("✅ Your final answers have been submitted successfully!");
    } catch (err) {
      setMessage("❌ Error submitting final answers. Try again.");
    }
  };

  return (
    <div className="final-page" style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Final Challenge</h2>
      <form onSubmit={handleSubmit}>
        <label>
          1. Your first answer:
          <input
            type="text"
            value={a1}
            onChange={(e) => setA1(e.target.value)}
            style={{ display: "block", margin: "10px auto", width: "300px" }}
          />
        </label>

        <label>
          2. Your second answer:
          <input
            type="text"
            value={a2}
            onChange={(e) => setA2(e.target.value)}
            style={{ display: "block", margin: "10px auto", width: "300px" }}
          />
        </label>

        <button type="submit" style={{ padding: "8px 16px" }}>
          Submit Final Answers
        </button>
      </form>

      <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>
    </div>
  );
}

export default FinalPage;
