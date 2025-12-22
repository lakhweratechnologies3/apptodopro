"use client";

import { useEffect, useState } from "react";

function getDaysLeftInYear(date) {
  const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59);
  const diff = endOfYear - date;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function HomePage() {  
  const [now, setNow] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    fetchImages();
    return () => clearInterval(timer);
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/dashboard-images');
      const data = await res.json();
      setImages(data);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/dashboard-images', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        await fetchImages();
        e.target.value = '';
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const res = await fetch(`/api/dashboard-images?id=${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchImages();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (!mounted || !now) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-white transition-colors">
        <h1 className="text-3xl font-bold mb-6 text-black">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 border-2 border-black">
            <div className="text-5xl font-bold text-black">...</div>
            <div className="text-gray-600 text-sm font-semibold">Loading...</div>
          </div>
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 border-2 border-black">
            <div className="text-3xl font-mono font-bold text-black">...</div>
            <div className="text-gray-600 text-sm font-semibold">Current Time</div>
          </div>
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 border-2 border-black">
            <div className="text-4xl font-bold text-black">...</div>
            <div className="text-gray-600 text-sm font-semibold">Today</div>
          </div>
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 border-2 border-black">
            <div className="text-2xl font-bold text-black text-center">...</div>
            <div className="text-gray-600 text-sm font-semibold">Current Date</div>
          </div>
        </div>
      </main>
    );
  }

  const daysLeft = getDaysLeftInYear(now);
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });


  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-white transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-black">Dashboard</h1>
      
      {/* Image Upload Section */}
      <div className="w-full max-w-6xl mb-8">
        <div className="bg-white rounded-xl shadow p-6 border-2 border-black">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Dashboard Images</h2>
            <label className="px-4 py-2 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              {uploading ? 'Uploading...' : '+ Add Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          
          {images.length > 0 ? (
            <div
              className={`grid gap-4 ${
                images.length === 1
                  ? 'grid-cols-1'
                  : images.length === 2
                  ? 'grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              {images.map((image) => (
                <div key={image._id} className="relative group">
                  <img
                    src={image.url}
                    alt="Dashboard"
                    className={`w-full ${
                      images.length === 1
                        ? 'h-auto max-h-[32rem]'
                        : 'h-auto max-h-56'
                    } object-contain rounded-lg border-2 border-gray-200 bg-white`}
                  />
                  <button
                    onClick={() => handleImageDelete(image._id)}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No images uploaded yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {/* Days Left Widget */}
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 border-2 border-black">
          <div className="text-5xl font-bold text-black">{daysLeft}</div>
          <div className="text-gray-600 text-sm font-semibold">Days left in {now.getFullYear()}</div>
        </div>
        
        {/* Clock Widget */}
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 border-2 border-black">
          <div className="text-3xl font-mono font-bold text-black">{timeStr}</div>
          <div className="text-gray-600 text-sm font-semibold">Current Time</div>
        </div>

        {/* Day Widget */}
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 border-2 border-black">
          <div className="text-4xl font-bold text-black">{dayName}</div>
          <div className="text-gray-600 text-sm font-semibold">Today</div>
        </div>

        {/* Date Widget */}
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 border-2 border-black">
          <div className="text-2xl font-bold text-black text-center">{dateStr}</div>
          <div className="text-gray-600 text-sm font-semibold">Current Date</div>
        </div>
      </div>
    </main>
  );
}
