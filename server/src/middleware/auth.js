const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Middleware to authenticate a user via JWT in the Authorization header.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Load user from database (ensure they still exist)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4. Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error); // Error handler handles JsonWebTokenError and TokenExpiredError
  }
};

/**
 * Middleware factory to authorize specific roles.
 * @param  {...string} roles - Array of allowed roles (e.g., 'admin', 'provider')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
