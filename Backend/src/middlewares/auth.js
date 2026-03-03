const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
  const tokenFromQuery = req.query && typeof req.query.token === 'string' ? req.query.token : null;
  const token = tokenFromHeader || tokenFromQuery;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = auth;
