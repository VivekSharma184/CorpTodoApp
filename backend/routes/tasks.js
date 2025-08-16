const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Get all tasks (protected route)
router.get('/', auth, async (req, res) => {
  try {
    console.log(`Fetching all tasks for user ${req.userId}`);
    const tasks = await Task.find({ user: req.userId });
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single task (protected route)
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task (protected route)
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received task creation request:', req.body);
    const task = new Task({
      ...req.body,
      user: req.userId
    });
    const savedTask = await task.save();
    console.log('Task saved successfully:', savedTask);
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error saving task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update a task (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    console.log(`Updating task ${req.params.id}:`, req.body);
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      {
      new: true,
      runValidators: true
    });
    if (!task) {
      console.log(`Task ${req.params.id} not found`);
      return res.status(404).json({ error: 'Task not found' });
    }
    console.log('Task updated successfully:', task);
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a task (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(`Deleting task ${req.params.id}`);
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) {
      console.log(`Task ${req.params.id} not found`);
      return res.status(404).json({ error: 'Task not found' });
    }
    console.log('Task deleted successfully');
    res.json(task);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
