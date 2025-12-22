import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['text', 'diagram'],
    default: 'text'
  },
  diagramData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { 
  timestamps: true 
});

if (mongoose.models.Document) {
  delete mongoose.models.Document;
}

const Document = mongoose.model('Document', DocumentSchema);

export default Document;
