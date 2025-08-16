const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users (for testing/debugging only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -salt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all users (for testing/debugging only)
router.delete('/users', async (req, res) => {
  try {
    await User.deleteMany({});
    res.json({ message: 'All users deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
