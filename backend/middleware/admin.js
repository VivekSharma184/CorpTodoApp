const User = require('../models/User');

/**
 * Middleware to check if a user has admin privileges
 * Note: This must be used after the auth middleware
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // auth middleware should have added userId to req
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = adminMiddleware;
