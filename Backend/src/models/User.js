const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['civilian', 'hospital', 'ngo'], required: true },
    name: { type: String, required: true },
    phone: { type: String },
    fcmTokens: {
      type: [String],
      default: [],
    },
    readNotificationIds: {
      type: [String],
      default: [],
    },
    notificationsClearedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
