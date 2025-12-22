import mongoose from 'mongoose';

const DashboardImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.DashboardImage || mongoose.model('DashboardImage', DashboardImageSchema);
