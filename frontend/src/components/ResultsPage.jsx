import React, { useEffect, useState } from "react";

function ResultsPage() {
  const [results, setresults] = useState([]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/results`);
      if (res.ok) {
        const json = await res.json();
        setresults(json);
      }
    } catch (err) {
      console.error("Error fetching results:", err);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  };

  return (
    <div style={{ padding: "2rem", backgroundColor: "#0a0f1a", color: "white" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Results</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#111827",
          color: "white",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#1f2937" }}>
            <th style={thStyle}>Team</th>
            <th style={thStyle}>Start Time</th> {/* ✅ New Column */}
            <th style={thStyle}>Level 1</th>
            <th style={thStyle}>Attempts (L1)</th>
            <th style={thStyle}>Time (L1)</th>
            <th style={thStyle}>Level 2</th>
            <th style={thStyle}>Attempts (L2)</th>
            <th style={thStyle}>Time (L2)</th>
            <th style={thStyle}>Level 3</th>
            <th style={thStyle}>Attempts (L3)</th>
            <th style={thStyle}>Time (L3)</th>
            <th style={thStyle}>Final</th>
            <th style={thStyle}>Attempts (Final)</th>
            <th style={thStyle}>Time (Final)</th>
            <th style={thStyle}>Total Time</th>
          </tr>
        </thead>

        <tbody>
          {results.map((team, index) => (
            <tr key={index}>
              <td style={tdStyle}>{team.team}</td>
              <td style={tdStyle}>{formatDateTime(team.start_time)}</td> {/* ✅ Display Start Time */}
              <td style={tdStyle}>{team.level1?.status || "-"}</td>
              <td style={tdStyle}>{team.level1?.attempts ?? "-"}</td>
              <td style={tdStyle}>{formatDateTime(team.level1?.timestamp)}</td>
              <td style={tdStyle}>{team.level2?.status || "-"}</td>
              <td style={tdStyle}>{team.level2?.attempts ?? "-"}</td>
              <td style={tdStyle}>{formatDateTime(team.level2?.timestamp)}</td>
              <td style={tdStyle}>{team.level3?.status || "-"}</td>
              <td style={tdStyle}>{team.level3?.attempts ?? "-"}</td>
              <td style={tdStyle}>{formatDateTime(team.level3?.timestamp)}</td>
              <td style={tdStyle}>{team.final?.status || "-"}</td>
              <td style={tdStyle}>{team.final?.attempts ?? "-"}</td>
              <td style={tdStyle}>{formatDateTime(team.final?.timestamp)}</td>
              <td style={tdStyle}>{team.total_time || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ✅ Simple consistent styles
const thStyle = {
  border: "1px solid #374151",
  padding: "8px",
  textAlign: "center",
  color: "#d1d5db",
};

const tdStyle = {
  border: "1px solid #374151",
  padding: "8px",
  textAlign: "center",
  color: "white",
};

export default ResultsPage;