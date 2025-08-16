const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT secret key - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    // FOR TESTING ONLY: Override existing user or create new one
    // In production, uncomment the code below to prevent duplicate users
    /*
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }
    */
    
    // If user exists, delete it first (TESTING ONLY)
    if (existingUser) {
      await User.deleteOne({ _id: existingUser._id });
      console.log(`Removed existing user ${existingUser.username} for testing`);
    }

    // Create new user with password
    const newUser = new User({
      username,
      email,
      password
    });
    
    // Password will be hashed by the pre-save hook

    // Save user
    const savedUser = await newUser.save();

    // Generate token
    const token = generateToken(savedUser._id);

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found, validating password');
    
    // Direct password comparison for debugging
    try {
      // Check password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('Password invalid for user:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (pwError) {
      console.error('Error during password validation:', pwError);
      return res.status(500).json({ error: 'Error validating credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -salt');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
