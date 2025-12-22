import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, default: "" },
  faviconUrl: { type: String, default: "" },
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);
