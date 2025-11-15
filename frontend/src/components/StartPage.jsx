// src/components/StartPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function StartPage() {
  const [team, setTeam] = useState("");
  const navigate = useNavigate();

  const now = new Date();
const offsetIST = 5.5 * 60 * 60 * 1000;
const istTime = new Date(now.getTime() + offsetIST).toISOString();

  const handleStart = async (e) => {
    e.preventDefault();
    if (!team.trim()) return;

    const res = await fetch(`${import.meta.env.VITE_API_BASE}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team, timestamp: istTime }),
    });

    const data = await res.json();
    if (res.ok) {
      sessionStorage.setItem("team", team);
      navigate("/level1"); // ✅ Fixed route
    } else {
      alert(data.error || "Error starting game");
    }
  };

  return (
    <div className="start-page">
      <h2>Enter Team Name</h2>
      <form onSubmit={handleStart}>
        <input
          type="text"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="Team Name"
        />
        <button type="submit">Start</button>
      </form>
    </div>
  );
}

export default StartPage;
