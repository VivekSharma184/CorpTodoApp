const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const Task = require('../models/Task');
const KnowledgeEntry = require('../models/KnowledgeEntry');

// All routes here are protected by auth and admin middleware
router.use(auth);
router.use(adminMiddleware);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific user by ID
router.get('/users/:id', async (req, res) => {
  try {
    console.log('Admin - Get user by ID:', req.params.id);
    
    // Validate ID format to avoid casting errors
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid user ID format:', req.params.id);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    console.log('User found:', user ? 'yes' : 'no');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get stats for a specific user
router.get('/users/:id/stats', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Admin - Get stats for user ID:', userId);
    
    // Validate ID format to avoid casting errors
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID format for stats:', userId);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Verify the user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      console.log('User not found for stats:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Count user's tasks and knowledge entries
    const taskCount = await Task.countDocuments({ user: userId });
    const knowledgeCount = await KnowledgeEntry.countDocuments({ user: userId });
    
    console.log('Stats found:', { tasks: taskCount, knowledge: knowledgeCount });
    
    res.json({
      tasks: taskCount,
      knowledge: knowledgeCount
    });
  } catch (error) {
    console.error(`Error fetching stats for user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, role } = req.body;
    
    // Make sure required fields are provided
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }
    
    // Check if updating to an existing email/username (that's not this user's)
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: req.params.id }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Another user with that email or username already exists' 
      });
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete all tasks for a specific user
router.delete('/users/:id/tasks', async (req, res) => {
  try {
    const result = await Task.deleteMany({ user: req.params.id });
    
    res.json({ 
      message: `Deleted ${result.deletedCount} tasks for user ${req.params.id}` 
    });
  } catch (error) {
    console.error(`Error deleting tasks for user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete all knowledge entries for a specific user
router.delete('/users/:id/knowledge', async (req, res) => {
  try {
    const result = await KnowledgeEntry.deleteMany({ user: req.params.id });
    
    res.json({ 
      message: `Deleted ${result.deletedCount} knowledge entries for user ${req.params.id}` 
    });
  } catch (error) {
    console.error(`Error deleting knowledge entries for user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    const knowledgeCount = await KnowledgeEntry.countDocuments();
    
    res.json({
      users: userCount,
      tasks: taskCount,
      knowledgeEntries: knowledgeCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Make a user an admin
router.put('/users/:id/make-admin', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove admin role from user
router.put('/users/:id/remove-admin', async (req, res) => {
  try {
    // Don't allow removing admin role from yourself
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Cannot remove your own admin privileges' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'user' },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error removing admin role:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account from admin panel' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Also delete all associated data
    await Task.deleteMany({ user: req.params.id });
    await KnowledgeEntry.deleteMany({ user: req.params.id });
    
    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear all tasks
router.delete('/data/tasks', async (req, res) => {
  try {
    await Task.deleteMany({});
    res.json({ message: 'All tasks deleted successfully' });
  } catch (error) {
    console.error('Error deleting tasks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear all knowledge entries
router.delete('/data/knowledge', async (req, res) => {
  try {
    await KnowledgeEntry.deleteMany({});
    res.json({ message: 'All knowledge entries deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge entries:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear everything (except users)
router.delete('/data/all', async (req, res) => {
  try {
    await Task.deleteMany({});
    await KnowledgeEntry.deleteMany({});
    res.json({ message: 'All tasks and knowledge entries deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new user as admin
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email and password' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with that email or username already exists' 
      });
    }
    
    // Create new user
    const newUser = new User({ 
      username, 
      email, 
      password, // Will be hashed via pre-save hook
      role 
    });
    
    await newUser.save();
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// First-time admin setup (creates an admin if none exist)
router.post('/setup-admin', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount > 0) {
      return res.status(400).json({ error: 'Admin already exists' });
    }
    
    // Make the current user an admin
    const user = await User.findByIdAndUpdate(
      req.userId,
      { role: 'admin' },
      { new: true, select: '-password' }
    );
    
    res.json({ message: 'You are now an admin', user });
  } catch (error) {
    console.error('Error setting up admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
