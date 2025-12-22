import mongoose from "mongoose";

const TimeTrackerSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in seconds
  notes: { type: String, default: "" },
  isRunning: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.TimeTracker || mongoose.model("TimeTracker", TimeTrackerSchema);
