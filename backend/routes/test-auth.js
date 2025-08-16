const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Test route to create a user with a simple password and return the hashed version
router.post('/create-test-user', async (req, res) => {
  try {
    // Delete any existing test users
    await User.deleteMany({ username: 'testuser' });
    
    // Create a simple test user with known credentials
    const testPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    });
    
    await user.save();
    
    res.json({
      message: 'Test user created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      testPassword: testPassword,
      hashedPassword: hashedPassword
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test route to validate a password directly
router.post('/validate-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Direct bcrypt validation
    const isValid = await bcrypt.compare(password, user.password);
    
    // Output debugging info
    res.json({
      isValid,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      passwordLength: password.length,
      hashedPasswordLength: user.password.length
    });
  } catch (error) {
    console.error('Error validating password:', error);
    res.status(500).json({ error: error.message });
  }
});

// Make a specific user an admin
router.post('/make-admin', async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      message: 'User is now an admin', 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Make all users admin (be careful!)
router.post('/make-all-admin', async (req, res) => {
  try {
    const result = await User.updateMany(
      {},
      { role: 'admin' }
    );
    
    res.json({ 
      message: `${result.modifiedCount} users are now admins`
    });
  } catch (error) {
    console.error('Error making users admin:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
