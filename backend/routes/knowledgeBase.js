const express = require('express');
const router = express.Router();
const KnowledgeEntry = require('../models/KnowledgeEntry');
const auth = require('../middleware/auth');

// Get all knowledge entries with optional filtering (protected route)
router.get('/', auth, async (req, res) => {
  try {
    const { category, status, tag, search } = req.query;
    
    // Build query filters
    const filter = {
      // Filter by authenticated user
      user: req.userId
    };
    
    if (category) {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    } else {
      // By default, don't show archived entries
      filter.status = { $ne: 'archived' };
    }
    
    if (tag) {
      filter.tags = tag;
    }

    let entries;
    
    if (search) {
      // Use MongoDB text search
      entries = await KnowledgeEntry.find(
        { 
          $text: { $search: search },
          ...filter
        },
        { 
          score: { $meta: "textScore" } 
        }
      )
      .sort({ score: { $meta: "textScore" } })
      .lean();
    } else {
      // Regular query without text search
      entries = await KnowledgeEntry.find(filter)
        .sort({ updatedAt: -1 })
        .lean();
    }
    
    res.json(entries);
  } catch (error) {
    console.error('Error getting knowledge entries:', error);
    res.status(500).json({ error: 'Failed to get knowledge entries' });
  }
});

// Get all unique tags used in knowledge entries (protected route)
router.get('/tags', auth, async (req, res) => {
  try {
    // Find all knowledge entries for the current user
    const entries = await KnowledgeEntry.find({ user: req.userId }).select('tags').lean();
    
    // Extract all tags from all entries
    let allTags = [];
    entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        allTags = [...allTags, ...entry.tags];
      }
    });
    
    // Return unique tags
    const uniqueTags = [...new Set(allTags)];
    res.json(uniqueTags);
  } catch (error) {
    console.error('Error getting knowledge entry tags:', error);
    res.status(500).json({ error: 'Failed to get tags' });
  }
});

// Get a single knowledge entry by ID (protected route)
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await KnowledgeEntry.findOne({
      _id: req.params.id,
      user: req.userId
    })
      .populate('relatedEntries', 'title category')
      .populate('relatedTasks', 'title priority')
      .lean();
    
    if (!entry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error getting knowledge entry:', error);
    res.status(500).json({ error: 'Failed to get knowledge entry' });
  }
});

// Create a new knowledge entry (protected route)
router.post('/', auth, async (req, res) => {
  try {
    const newEntry = new KnowledgeEntry({
      ...req.body,
      user: req.userId
    });
    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    res.status(400).json({ error: 'Failed to create knowledge entry', details: error.message });
  }
});

// Update a knowledge entry (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    // If content was changed, increment the version
    const currentEntry = await KnowledgeEntry.findById(req.params.id);
    if (currentEntry && req.body.content && req.body.content !== currentEntry.content) {
      req.body.version = currentEntry.version + 1;
    }
    
    const updatedEntry = await KnowledgeEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }
    
    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    res.status(400).json({ error: 'Failed to update knowledge entry' });
  }
});

// Delete a knowledge entry (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await KnowledgeEntry.findOneAndDelete({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }
    
    res.json({ message: 'Knowledge entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    res.status(500).json({ error: 'Failed to delete knowledge entry' });
  }
});


// Search knowledge entries (more advanced than the filter in GET /)
router.post('/search', async (req, res) => {
  try {
    const { query, categories, tags, dateRange, status } = req.body;
    
    // Build MongoDB query
    const filter = {};
    
    if (status) {
      filter.status = status;
    } else {
      // Default to only published entries
      filter.status = 'published';
    }
    
    if (categories && categories.length > 0) {
      filter.category = { $in: categories };
    }
    
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }
    
    if (dateRange) {
      const { start, end } = dateRange;
      filter.createdAt = {};
      
      if (start) {
        filter.createdAt.$gte = new Date(start);
      }
      
      if (end) {
        filter.createdAt.$lte = new Date(end);
      }
    }
    
    let entries;
    
    if (query) {
      // Full-text search with additional filters
      entries = await KnowledgeEntry.find({
        $text: { $search: query },
        ...filter
      }, {
        score: { $meta: "textScore" }
      })
      .sort({ score: { $meta: "textScore" } })
      .lean();
    } else {
      // Just apply filters without text search
      entries = await KnowledgeEntry.find(filter)
        .sort({ updatedAt: -1 })
        .lean();
    }
    
    res.json(entries);
  } catch (error) {
    console.error('Error searching knowledge entries:', error);
    res.status(500).json({ error: 'Failed to search knowledge entries' });
  }
});

// Link a knowledge entry to tasks
router.post('/:id/link-tasks', async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'taskIds must be an array' });
    }
    
    const entry = await KnowledgeEntry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }
    
    // Add new task IDs, avoiding duplicates
    entry.relatedTasks = [...new Set([...entry.relatedTasks, ...taskIds])];
    
    await entry.save();
    
    res.json(entry);
  } catch (error) {
    console.error('Error linking tasks to knowledge entry:', error);
    res.status(500).json({ error: 'Failed to link tasks' });
  }
});

module.exports = router;
