const mongoose = require('mongoose');

const knowledgeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['incident', 'solution', 'process', 'reference', 'other']
  },
  tags: [String],
  relatedEntries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeEntry'
  }],
  relatedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  createdBy: {
    type: String,
    default: 'System'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // For versioning of entries
  version: {
    type: Number,
    default: 1
  },
  // For search optimization
  searchableText: {
    type: String
  }
});

// Index for full-text search
knowledgeEntrySchema.index({ searchableText: 'text', title: 'text' });

// Pre-save hook to update searchableText
knowledgeEntrySchema.pre('save', function(next) {
  // Combine title, content and tags for searchable text
  this.searchableText = [
    this.title,
    this.content,
    ...(this.tags || [])
  ].join(' ');
  
  // Update the updatedAt timestamp
  this.updatedAt = Date.now();
  
  next();
});

// Create indexes for better query performance
knowledgeEntrySchema.index({ user: 1, category: 1 });
knowledgeEntrySchema.index({ user: 1, tags: 1 });
knowledgeEntrySchema.index({ user: 1, title: 'text', content: 'text' });

const KnowledgeEntry = mongoose.model('KnowledgeEntry', knowledgeEntrySchema);

module.exports = KnowledgeEntry;
