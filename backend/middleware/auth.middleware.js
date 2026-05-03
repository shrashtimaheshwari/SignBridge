const { verifyToken } = require('../utils/jwt.utils');

/**
 * Express middleware to protect routes with JWT authentication.
 * Expects header: Authorization: Bearer <token>
 */
function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.user = decoded;
  next();
}

module.exports = { protect };
