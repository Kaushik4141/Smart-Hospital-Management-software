const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = (req, res, next) => {
  // Bypassing authentication
  next();
};

// Middleware to authorize roles
const authorize = (...roles) => {
  // Bypassing authorization
  return (req, res, next) => {
    next();
  };
};

module.exports = { protect, authorize };
