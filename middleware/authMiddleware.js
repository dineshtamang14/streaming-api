// middleware/authMiddleware.js

// Example authentication middleware
module.exports = (req, res, next) => {
  // Check for auth token
  const token = req.headers['authorization'];
  if (token) {
    // Proceed to the next middleware or route handler
    next();
  } else {
    res.status(403).send('Forbidden');
  }
};