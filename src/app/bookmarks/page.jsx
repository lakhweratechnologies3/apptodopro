"use client";

import { useEffect, useState } from "react";
import { MdDelete, MdPushPin, MdOutlinePushPin } from "react-icons/md";

export default function BookmarksPage() {
  const [items, setItems] = useState([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchBookmarks = async (query = "") => {
    try {
      const endpoint = query ? `/api/bookmarks?q=${encodeURIComponent(query)}` : "/api/bookmarks";
      const res = await fetch(endpoint);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBookmarks(search);
  }, [search]);

  const addBookmark = async (e) => {
    e && e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), title: title.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setUrl("");
      setTitle("");
      await fetchBookmarks(search);
    } catch (err) {
      console.error(err);
      alert("Could not add bookmark");
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (id, currentPinned) => {
    try {
      // Optimistically update UI
      setItems(prev => prev.map(item => 
        item._id === id ? { ...item, pinned: !currentPinned } : item
      ).sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }));

      const res = await fetch("/api/bookmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pinned: !currentPinned }),
      });
      
      if (!res.ok) {
        // Revert on error
        setItems(prev => prev.map(item => 
          item._id === id ? { ...item, pinned: currentPinned } : item
        ));
        throw new Error("Pin failed");
      }
    } catch (e) {
      console.error("Pin error:", e);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this bookmark?")) return;
    try {
      await fetch("/api/bookmarks", { method: "DELETE", body: JSON.stringify({ id }), headers: { "Content-Type": "application/json" } });
      await fetchBookmarks(search);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 20, minHeight: "100vh", background: "#f7f7f7" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Bookmarks</h1>
        <form onSubmit={addBookmark} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <input
            placeholder="Optional title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: 240, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <button disabled={loading} style={{ padding: "8px 12px", borderRadius: 6, background: "#111", color: "#fff", border: 0 }}>
            Add
          </button>
        </form>

        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {items.map((it) => (
            <div
              key={it._id}
              role="button"
              onClick={() => window.open(it.url, "_blank")}
              style={{
                width: "100%",
                padding: 12,
                background: "#fff",
                borderRadius: 8,
                border: it.pinned ? "2px solid #ff6b00" : "1px solid #e5e5e5",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(it._id, !!it.pinned);
                  }}
                  title={it.pinned ? "Unpin" : "Pin"}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: it.pinned ? "#ff6b00" : "#999",
                    padding: 4,
                    display: "flex",
                  }}
                >
                  {it.pinned ? <MdPushPin size={18} /> : <MdOutlinePushPin size={18} />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(it._id);
                  }}
                  title="Delete bookmark"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#c00",
                    padding: 4,
                  }}
                >
                  <MdDelete size={18} />
                </button>
              </div>

              <img
                src={it.faviconUrl || `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(it.url)}`}
                alt="favicon"
                style={{ width: 28, height: 28, borderRadius: 999, objectFit: "cover", background: "#fff" }}
              />

              <div style={{ fontWeight: 700, textAlign: "center", fontSize: 14, wordBreak: "break-word" }}>{it.title || it.url}</div>
              <a href={it.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "#555", fontSize: 12, textAlign: "center", wordBreak: "break-all" }}>{it.url}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
