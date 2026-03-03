const bcrypt = require('bcryptjs');
const User = require('../models/User');
const CivilianProfile = require('../models/CivilianProfile');
const HospitalProfile = require('../models/HospitalProfile');
const NgoProfile = require('../models/NgoProfile');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/jwt');

const register = asyncHandler(async (req, res) => {
  const { email, password, role, name, phone, profile } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || !password || !role || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!['civilian', 'hospital', 'ngo'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ message: 'Missing profile details' });
  }
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: normalizedEmail, passwordHash, role, name, phone });

  if (role === 'civilian') {
    await CivilianProfile.create({ userId: user._id, ...profile });
  }
  if (role === 'hospital') {
    await HospitalProfile.create({ userId: user._id, ...profile });
  }
  if (role === 'ngo') {
    await NgoProfile.create({ userId: user._id, ...profile });
  }

  const token = signToken({ id: user._id, role: user.role });
  res.json({ token, user: { id: user._id, role: user.role, email: user.email, name: user.name } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (!user.passwordHash || typeof user.passwordHash !== 'string') {
    return res.status(400).json({
      message: 'Account is missing a password. Please reset or re-register.',
    });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = signToken({ id: user._id, role: user.role });
  res.json({ token, user: { id: user._id, role: user.role, email: user.email, name: user.name } });
});

module.exports = { register, login };
