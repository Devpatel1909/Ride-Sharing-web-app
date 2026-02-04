const jwt = require('jsonwebtoken');

const authenticateRider = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, rider) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.rider = rider;
    next();
  });
};

module.exports = { authenticateRider };