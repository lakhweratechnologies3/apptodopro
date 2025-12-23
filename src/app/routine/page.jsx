"use client";

import { useEffect, useRef, useState } from "react";
import { MdPushPin, MdOutlinePushPin } from "react-icons/md";

function RoutinePage() {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [links, setLinks] = useState([""]);
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);
  const [showForm, setShowForm] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fieldWrapperStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: "1 1 220px",
    minWidth: 200,
  };
  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#222",
  };
  const baseInputStyle = {
    width: "100%",
    padding: 8,
    borderRadius: 6,
    border: "1px solid #bbb",
    background: "#fafafa",
    color: "#111",
    fontSize: 16,
    boxSizing: "border-box",
  };

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const formatDisplayDate = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDisplayTime = (value) => {
    if (!value) return "";
    const [hour, minute] = value.split(":").map((part) => Number(part));
    if (Number.isNaN(hour)) return value;
    const base = new Date();
    base.setHours(hour);
    base.setMinutes(Number.isNaN(minute) ? 0 : minute);
    base.setSeconds(0, 0);
    return base.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getScheduleText = (routine) => {
    const pieces = [];
    const d = formatDisplayDate(routine?.date);
    const start = formatDisplayTime(routine?.startTime);
    const end = formatDisplayTime(routine?.endTime);
    const range = start && end ? `${start} – ${end}` : start || end;
    if (d) pieces.push(d);
    if (range) pieces.push(range);
    return pieces.join(" · ");
  };

  const getSortTimestamp = (routine) => {
    if (!routine?.date) return Number.MAX_SAFE_INTEGER;
    const timePart = routine?.startTime || "00:00";
    const parsed = Date.parse(`${routine.date}T${timePart}`);
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
  };

  const togglePin = async (routineId, nextPinned) => {
    try {
      const res = await fetch(`/api/routine/${routineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: nextPinned }),
      });
      if (!res.ok) throw new Error("Pin update failed");
      fetchRoutines();
    } catch (err) {
      console.error("Pin toggle failed", err);
      alert("Could not update pin state.");
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(previewUrl);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openLightbox = (url, name) => {
    if (!url) return;
    setLightboxImage({ url, name });
  };

  const closeLightbox = () => setLightboxImage(null);

  // Fetch routines from API
  const fetchRoutines = async () => {
    try {
      const res = await fetch("/api/routine");
      const data = await res.json();
      if (!Array.isArray(data)) {
        setRoutines([]);
        return;
      }
      const sorted = [...data].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) {
          return a.pinned ? -1 : 1;
        }
        const timeDiff = getSortTimestamp(a) - getSortTimestamp(b);
        if (timeDiff !== 0) return timeDiff;
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });
      setRoutines(sorted);
    } catch (err) {
      console.error("Fetch routines failed:", err);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const resetFormState = () => {
    setEditId(null);
    setName("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setLinks([""]);
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add new routine
  const addRoutine = async () => {
    if (!name.trim() || !date.trim() || !startTime.trim() || !endTime.trim()) {
      alert("Name, date, start, and end time are required.");
      return;
    }
    const cleanedLinks = links.map((l) => l.trim()).filter(Boolean);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("date", date.trim());
      formData.append("startTime", startTime.trim());
      formData.append("endTime", endTime.trim());
      formData.append("links", JSON.stringify(cleanedLinks));
      formData.append("description", description.trim());
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (removeImage) {
        formData.append("removeImage", "true");
      }

      const endpoint = editId ? `/api/routine/${editId}` : "/api/routine";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Request failed");
      }

      if (payload?._id) {
        if (editId) {
          setRoutines((prev) => prev.map((r) => (r._id === payload._id ? payload : r)));
        } else {
          setRoutines((prev) => [...prev, payload]);
        }
      }

      resetFormState();
      fetchRoutines();
    } catch (err) {
      alert(editId ? "Update failed" : "Add routine failed");
    }
  };

  // Delete routine
  const deleteRoutine = async (id) => {
    try {
      await fetch(`/api/routine/${id}`, { method: "DELETE" });
      setRoutines((prev) => prev.filter((r) => r._id !== id));
      if (editId === id) {
        resetFormState();
      }
    } catch (err) {
      console.error("Delete routine failed:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, textAlign: "center", color: "#111", letterSpacing: 1 }}>Routine Diary</h1>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: showForm ? 12 : 20 }}>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            style={{
              background: showForm ? "#f2f2f2" : "#111",
              color: showForm ? "#111" : "#fff",
              border: "1px solid #111",
              borderRadius: 999,
              padding: "6px 20px",
              fontWeight: 600,
              letterSpacing: 0.5,
              cursor: "pointer",
            }}
          >
            {showForm ? "Hide Routine Form" : "+ Add Routine"}
          </button>
        </div>
        {showForm && (
          <form
          onSubmit={(e) => {
            e.preventDefault();
            addRoutine();
          }}
          style={{
            width: "100%",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
            marginBottom: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
            boxShadow: "0 4px 16px #0001",
          }}
        >
          <div style={{ ...fieldWrapperStyle }}>
            <label style={labelStyle}>Name</label>
            <input
              style={baseInputStyle}
              placeholder="Task name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div style={{ ...fieldWrapperStyle }}>
            <label style={labelStyle}>Date</label>
            <input
              style={baseInputStyle}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div style={{ ...fieldWrapperStyle }}>
            <label style={labelStyle}>Start time</label>
            <input
              style={baseInputStyle}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div style={{ ...fieldWrapperStyle }}>
            <label style={labelStyle}>End time</label>
            <input
              style={baseInputStyle}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div style={{ ...fieldWrapperStyle }}>
            <label style={labelStyle}>Image (optional)</label>
            <input
              ref={fileInputRef}
              style={{ ...baseInputStyle, padding: 6 }}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                <img
                  src={imagePreview}
                  alt="Routine preview"
                  style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 10, border: "1px solid #ddd" }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    background: "#fff",
                    border: "1px solid #c00",
                    color: "#c00",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
          <div style={{ ...fieldWrapperStyle, gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={labelStyle}>Links</label>
              <button
                type="button"
                onClick={() => setLinks([...links, ""])}
                style={{
                  background: "none",
                  border: "1px solid #333",
                  color: "#111",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "2px 10px",
                  borderRadius: 6,
                }}
              >
                + Link
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {links.map((link, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    style={{ ...baseInputStyle, flex: 1 }}
                    placeholder={`Link ${idx + 1}`}
                    value={link}
                    onChange={(e) => {
                      const copy = [...links];
                      copy[idx] = e.target.value;
                      setLinks(copy);
                    }}
                    maxLength={300}
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                      style={{
                        background: "none",
                        border: 0,
                        color: "#c00",
                        fontWeight: 700,
                        fontSize: 18,
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Remove link"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...fieldWrapperStyle, gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...baseInputStyle, minHeight: 80, resize: "vertical" }}
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={600}
              rows={3}
            />
          </div>
          <div style={{ display: "flex", gap: 12, gridColumn: "1 / -1" }}>
            <button
              type="submit"
              style={{
                background: editId ? "#0a0" : "#111",
                color: "#fff",
                fontWeight: 600,
                padding: "8px 20px",
                borderRadius: 8,
                border: 0,
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              {editId ? "Update" : "Add"}
            </button>
            {editId && (
              <button
                type="button"
                style={{
                  background: "#aaa",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: 0,
                  cursor: "pointer",
                  letterSpacing: 0.5,
                }}
                onClick={resetFormState}
              >
                Cancel
              </button>
            )}
          </div>
          </form>
        )}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 260px))",
          gap: 18,
          marginTop: 10,
          width: '100%',
          justifyContent: 'center'
        }}>
          {routines.map((r, idx) => {
            const expanded = expandedIdx === idx;
            const dateInfo = (() => {
              let userUpdated = r.updated ? `Updated: ${r.updated}` : "";
              let created = r.createdAt ? new Date(r.createdAt) : null;
              let updated = r.updatedAt ? new Date(r.updatedAt) : null;
              let createdStr = created && !isNaN(created) ? `Created: ${created.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}` : "";
              let updatedStr = updated && !isNaN(updated) ? ` | Updated: ${updated.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}` : "";
              return [createdStr, updatedStr, userUpdated].filter(Boolean).join(" ");
            })();
            const scheduleText = getScheduleText(r);
            const isCollapsed = !expanded;

            return (
              <div
                key={r._id || `routine-${idx}`}
                style={{
                  background: "#fff",
                  color: "#111",
                  border: r.pinned ? "2px solid #ff6b00" : "2px solid #222",
                  borderRadius: 16,
                  width: 260,
                  boxSizing: 'border-box',
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  padding: 18,
                  minHeight: 20,
                  boxShadow: "0 2px 8px 0 #0002",
                  cursor: "pointer",
                  position: 'relative',
                  transition: 'all 0.2s',
                  zIndex: expanded ? 10 : 1,
                  /* collapsed cards use a fixed height; expanded cards allow inner scrolling inside the card */
                  maxHeight: expanded ? 560 : 220,
                  overflow: 'hidden'
                }}
                onClick={() => setExpandedIdx(expanded ? null : idx)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(r._id, !r.pinned);
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: r.pinned ? '#ff6b00' : '#666',
                    padding: 0,
                    display: 'flex'
                  }}
                  aria-label={r.pinned ? "Unpin routine" : "Pin routine"}
                >
                  {r.pinned ? <MdPushPin size={20} /> : <MdOutlinePushPin size={20} />}
                </button>
                <div style={{ width: "100%", flex: 1, overflowY: expanded ? 'auto' : 'hidden' }}>
                  {expanded && r.imageUrl && (
                    <div style={{ width: "100%", marginBottom: 12 }}>
                      <img
                        src={r.imageUrl}
                        alt={`${r.name} reference`}
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          border: "1px solid #ddd",
                          objectFit: "contain",
                          maxHeight: 320,
                          height: "auto",
                          background: "#fafafa",
                          cursor: "zoom-in",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox(r.imageUrl, r.name);
                        }}
                      />
                    </div>
                  )}
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 17,
                      marginBottom: scheduleText ? 2 : 0,
                      paddingRight: 26,
                      ...(isCollapsed
                        ? {
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        : {})
                    }}
                  >
                    {r.name}
                  </div>
                  {scheduleText && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#111',
                        fontWeight: 700,
                        marginBottom: expanded ? 8 : 0,
                        paddingRight: 26,
                        border: '1px solid #d11414',
                        borderRadius: 6,
                        padding: '2px 6px',
                        display: 'inline-block'
                      }}
                    >
                      {scheduleText}
                    </div>
                  )}
                  {expanded && (
                    <>
                      <div style={{ fontSize: 14, margin: "4px 0", color: "#222" }}>{r.description}</div>
                      {Array.isArray(r.links) && r.links.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {r.links.map((l, i) => l && (
                            <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={{ color: "#111", fontSize: 13, wordBreak: "break-all", textDecoration: "underline" }}>
                              {l}
                            </a>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setShowForm(true);
                            setEditId(r._id);
                            setName(r.name);
                            setDate(r.date);
                            setStartTime(r.startTime);
                            setEndTime(r.endTime || "");
                            setLinks(Array.isArray(r.links) && r.links.length ? r.links : [""]);
                            setDescription(r.description);
                            setImageFile(null);
                            setImagePreview(r.imageUrl || "");
                            setRemoveImage(false);
                          }}
                          style={{ color: "#fff", background: "#007", fontWeight: 600, border: 0, borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRoutine(r._id)}
                          style={{ color: "#fff", background: "#111", fontWeight: 600, border: 0, borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                      {dateInfo && (
                        <div onClick={e => e.stopPropagation()} style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                          <div style={{ fontSize: 11, color: '#666', lineHeight: 1 }}>{dateInfo}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {lightboxImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000c",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            zIndex: 999,
          }}
          onClick={closeLightbox}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              background: "#111",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 10px 30px #0006",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLightbox}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                border: 0,
                background: "#0006",
                color: "#fff",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                fontSize: 18,
              }}
              aria-label="Close image preview"
            >
              ×
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name || "Routine image"}
              style={{
                maxWidth: "80vw",
                maxHeight: "75vh",
                width: "100%",
                height: "auto",
                objectFit: "contain",
                borderRadius: 12,
              }}
            />
            {lightboxImage.name && (
              <div style={{ color: "#fff", marginTop: 10, textAlign: "center", fontWeight: 600 }}>
                {lightboxImage.name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoutinePage;

