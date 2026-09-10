const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for the given user.
 * @param {Object} user - The user object (must contain _id and role)
 * @returns {string} The signed JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = {
  generateToken,
};
