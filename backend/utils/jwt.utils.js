const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Creates a signed JWT token.
 * @param {Object} payload - Data to encode in the token (e.g. { sub: email })
 * @returns {string} Signed JWT string
 */
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token - JWT string to verify
 * @returns {Object|null} Decoded payload, or null if invalid/expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { createToken, verifyToken };
