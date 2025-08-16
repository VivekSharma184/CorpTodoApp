const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const KnowledgeEntry = require('../models/KnowledgeEntry');

/**
 * WARNING: This route is for development purposes only.
 * It should be removed or disabled in production.
 */

// Delete all tasks
router.delete('/tasks', async (req, res) => {
  try {
    await Task.deleteMany({});
    console.log('All tasks have been deleted');
    res.json({ message: 'All tasks have been deleted' });
  } catch (error) {
    console.error('Error deleting tasks:', error);
    res.status(500).json({ error: 'Failed to delete tasks' });
  }
});

// Delete all knowledge entries
router.delete('/knowledge', async (req, res) => {
  try {
    await KnowledgeEntry.deleteMany({});
    console.log('All knowledge entries have been deleted');
    res.json({ message: 'All knowledge entries have been deleted' });
  } catch (error) {
    console.error('Error deleting knowledge entries:', error);
    res.status(500).json({ error: 'Failed to delete knowledge entries' });
  }
});

// Delete all users
router.delete('/users', async (req, res) => {
  try {
    await User.deleteMany({});
    console.log('All users have been deleted');
    res.json({ message: 'All users have been deleted' });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// Delete everything (tasks, knowledge entries, and users)
router.delete('/all', async (req, res) => {
  try {
    await Task.deleteMany({});
    await KnowledgeEntry.deleteMany({});
    await User.deleteMany({});
    console.log('All database entries have been deleted');
    res.json({ message: 'All database entries have been deleted' });
  } catch (error) {
    console.error('Error deleting database entries:', error);
    res.status(500).json({ error: 'Failed to delete database entries' });
  }
});

module.exports = router;
