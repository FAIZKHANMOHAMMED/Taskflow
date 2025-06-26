const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Column title is required'],
    trim: true,
    maxlength: [100, 'Column title cannot exceed 100 characters']
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  color: {
    type: String,
    default: '#e9ecef'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
columnSchema.index({ boardId: 1, position: 1 });

module.exports = mongoose.model('Column', columnSchema);
