import mongoose from "mongoose";

const TodoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  imageUrl: { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Todo || mongoose.model("Todo", TodoSchema);