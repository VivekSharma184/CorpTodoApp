// Central configuration file for the application

// API endpoints - use environment variable or fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Export configurations
export {
  API_BASE_URL
};
