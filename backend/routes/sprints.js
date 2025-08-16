const express = require('express');
const router = express.Router();
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');

// Get all sprints
router.get('/', async (req, res) => {
  try {
    const sprints = await Sprint.find().sort({ startDate: -1 });
    res.json(sprints);
  } catch (error) {
    console.error('Error fetching sprints:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single sprint with its tasks
router.get('/:id', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    // Fetch tasks assigned to this sprint
    const tasks = await Task.find({ sprint: sprint._id });
    
    res.json({
      sprint,
      tasks
    });
  } catch (error) {
    console.error('Error fetching sprint details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new sprint
router.post('/', async (req, res) => {
  try {
    const sprint = new Sprint(req.body);
    const savedSprint = await sprint.save();
    res.status(201).json(savedSprint);
  } catch (error) {
    console.error('Error creating sprint:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update a sprint
router.put('/:id', async (req, res) => {
  try {
    const updatedSprint = await Sprint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedSprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    res.json(updatedSprint);
  } catch (error) {
    console.error('Error updating sprint:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a sprint
router.delete('/:id', async (req, res) => {
  try {
    // First, remove sprint reference from all associated tasks
    await Task.updateMany(
      { sprint: req.params.id },
      { $unset: { sprint: "" } }
    );
    
    // Then delete the sprint
    const sprint = await Sprint.findByIdAndDelete(req.params.id);
    
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    res.json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a task to a sprint
router.post('/:sprintId/tasks/:taskId', async (req, res) => {
  try {
    const { sprintId, taskId } = req.params;
    
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.sprint = sprintId;
    if (req.body.storyPoints) {
      task.storyPoints = req.body.storyPoints;
    }
    
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Error adding task to sprint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove a task from a sprint
router.delete('/:sprintId/tasks/:taskId', async (req, res) => {
  try {
    const { sprintId, taskId } = req.params;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if task is actually in this sprint
    if (task.sprint && task.sprint.toString() !== sprintId) {
      return res.status(400).json({ error: 'Task is not in this sprint' });
    }
    
    // Remove sprint reference
    task.sprint = undefined;
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Error removing task from sprint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sprint summary (burndown data)
router.get('/:id/burndown', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    // Get all tasks for this sprint
    const tasks = await Task.find({ sprint: sprint._id });
    
    // Calculate total story points
    const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0);
    
    // Calculate completed points by day
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Initialize burndown data with ideal burndown
    const burndownData = {
      dates: [],
      ideal: [],
      actual: []
    };
    
    // Generate dates and ideal burndown
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      burndownData.dates.push(date.toISOString().split('T')[0]);
      
      // Ideal burndown is a straight line from total to 0
      const idealRemaining = Math.max(0, totalPoints - (totalPoints / (totalDays - 1)) * i);
      burndownData.ideal.push(Math.round(idealRemaining * 10) / 10);
      
      // Initialize actual with null (will be filled below)
      burndownData.actual.push(null);
    }
    
    // Calculate actual burndown based on task completion dates
    const completedTasks = tasks.filter(task => task.completed && task.completedAt);
    
    for (const task of completedTasks) {
      const completionDate = new Date(task.completedAt);
      const dayIndex = Math.floor((completionDate - startDate) / (1000 * 60 * 60 * 24));
      
      // Only count if completed during the sprint
      if (dayIndex >= 0 && dayIndex < totalDays) {
        // Update all days after this completion
        for (let i = dayIndex; i < totalDays; i++) {
          // Initialize if first task being calculated for this day
          if (burndownData.actual[i] === null) {
            burndownData.actual[i] = totalPoints;
          }
          
          burndownData.actual[i] -= (task.storyPoints || 1);
        }
      }
    }
    
    // Fill in missing actual data
    let lastKnownValue = totalPoints;
    for (let i = 0; i < totalDays; i++) {
      if (burndownData.actual[i] === null) {
        burndownData.actual[i] = lastKnownValue;
      } else {
        lastKnownValue = burndownData.actual[i];
      }
    }
    
    res.json({
      burndownData,
      totalPoints,
      completedPoints: completedTasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0),
      tasksCount: tasks.length,
      completedTasksCount: completedTasks.length
    });
  } catch (error) {
    console.error('Error generating burndown chart:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
