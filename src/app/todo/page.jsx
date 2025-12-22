"use client";
import { useEffect, useRef, useState } from "react";

export default function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/todo");
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch todos failed", error);
    } finally {
      setLoading(false);
    }
  };

  const resetComposer = () => {
    setNewTodo("");
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("text", newTodo.trim());
      if (imageFile) {
        formData.append("image", imageFile);
      }
      const res = await fetch("/api/todo", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to add todo");
      }
      resetComposer();
      await fetchTodos();
    } catch (error) {
      console.error("Add todo failed", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id, completed) => {
    setLoading(true);
    try {
      await fetch("/api/todo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: !completed }),
      });
      await fetchTodos();
    } catch (error) {
      console.error("Toggle todo failed", error);
      setLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    setLoading(true);
    try {
      await fetch("/api/todo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchTodos();
    } catch (error) {
      console.error("Delete todo failed", error);
      setLoading(false);
    }
  };

  const openLightbox = (url, text) => {
    if (!url) return;
    setLightboxImage({ url, text });
  };

  const closeLightbox = () => setLightboxImage(null);

  return (
    <div className="p-8 min-h-screen bg-white dark:bg-black transition-colors">
      <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">Todo Page</h1>
      <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              type="text"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTodo()}
              placeholder="Describe your task..."
              className="flex-1 px-4 py-2 border border-black dark:border-white rounded bg-white text-black dark:text-white"
              disabled={loading}
            />
            <button
              onClick={addTodo}
              className="px-4 py-2 bg-black text-white dark:bg-white cursor-pointer dark:text-black rounded border border-black dark:border-white"
              disabled={loading}
            >
              Add
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-black dark:text-white">Attach reference image</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="block w-full text-sm text-black dark:text-white"
              disabled={loading}
            />
            {imagePreview && (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded border border-dashed border-black dark:border-white overflow-hidden bg-gray-50 dark:bg-gray-900">
                  <img src={imagePreview} alt="Todo preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-3 py-1 border border-red-500 text-red-500 rounded cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : todos.length === 0 ? (
            <div className="text-center text-gray-400">No todos yet.</div>
          ) : (
            todos.map(todo => {
              const expanded = expandedId === todo._id;
              return (
                <div
                  key={todo._id}
                  onClick={() => setExpandedId(expanded ? null : todo._id)}
                  className={`flex flex-col gap-3 p-3 rounded border border-gray-200 dark:border-gray-800 transition-all ${expanded ? 'max-h-[1000px]' : 'max-h-14 overflow-hidden'}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo._id, todo.completed)}
                      onClick={e => e.stopPropagation()}
                      className="accent-black dark:accent-white"
                    />
                    <span className={`flex-1 ${todo.completed ? "line-through text-gray-400" : "text-black dark:text-white"}`}>
                      {todo.text}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteTodo(todo._id); }}
                      className="text-red-500 cursor-pointer hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  {todo.imageUrl && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openLightbox(todo.imageUrl, todo.text); }}
                      className="self-start text-sm font-semibold text-black dark:text-white underline"
                    >
                      View image
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {lightboxImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={closeLightbox}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white text-black font-bold"
            >
              ×
            </button>
            <img src={lightboxImage.url} alt={lightboxImage.text || "Todo image"} className="w-full max-h-[80vh] object-contain rounded-lg" />
            {lightboxImage.text && (
              <p className="text-center text-white mt-4">{lightboxImage.text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
