"use client";
import { useEffect, useState } from "react";
import { MdPlayArrow, MdStop, MdDelete, MdHistory } from "react-icons/md";

export default function TimeTrackerWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startTimer = async () => {
    if (!projectName.trim()) {
      alert("Please enter project name");
      return;
    }

    try {
      const res = await fetch("/api/timetracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, notes }),
      });

      if (!res.ok) throw new Error("Failed to start session");
      
      const session = await res.json();
      setCurrentSessionId(session._id);
      setIsRunning(true);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to start timer");
    }
  };

  const stopTimer = async () => {
    if (!currentSessionId) return;

    try {
      await fetch("/api/timetracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentSessionId,
          endTime: new Date().toISOString(),
          duration: time,
          notes,
        }),
      });

      setIsRunning(false);
      setTime(0);
      setProjectName("");
      setNotes("");
      setCurrentSessionId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to stop timer");
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
    setProjectName("");
    setNotes("");
    setCurrentSessionId(null);
    setShowForm(false);
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: 12, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Time Tracker</div>
        <a href="/timetracker-history" style={{ color: "#007", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <MdHistory size={16} /> History
        </a>
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 12, fontFamily: "monospace", color: isRunning ? "#0a0" : "#111" }}>
        {formatTime(time)}
      </div>

      {!isRunning && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: "100%",
            padding: 10,
            background: "#111",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <MdPlayArrow size={18} /> Start Timer
        </button>
      )}

      {showForm && !isRunning && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            placeholder="Project name *"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
          />
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, fontSize: 13, resize: "none", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={startTimer}
              style={{
                flex: 1,
                padding: 8,
                background: "#0a0",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Start
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: 8,
                background: "#999",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isRunning && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>
            {projectName}
          </div>
          <textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, fontSize: 12, resize: "none", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={stopTimer}
              style={{
                flex: 1,
                padding: 10,
                background: "#c00",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <MdStop size={16} /> Stop
            </button>
            <button
              onClick={resetTimer}
              style={{
                padding: 10,
                background: "#fff",
                color: "#c00",
                border: "1px solid #c00",
                borderRadius: 6,
                cursor: "pointer",
              }}
              title="Cancel"
            >
              <MdDelete size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
