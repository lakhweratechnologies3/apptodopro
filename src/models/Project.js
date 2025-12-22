import mongoose from 'mongoose';

const TodoItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  todos: {
    type: [TodoItemSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Delete the existing model if it exists in development
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

const Project = mongoose.model('Project', ProjectSchema);

export default Project;
