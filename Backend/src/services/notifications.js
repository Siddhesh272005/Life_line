const User = require('../models/User');
const Notification = require('../models/Notification');
const { getFirebaseAdmin } = require('../config/firebase');

const normalizeData = (data = {}) => {
  const out = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    out[key] = String(value);
  });
  return out;
};

const sendToUserIds = async ({
  userIds = [],
  title,
  body,
  data = {},
  type = 'general',
  persistNotification = true,
}) => {
  const admin = getFirebaseAdmin();
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { sent: 0, skipped: true };
  }

  const uniqueIds = [...new Set(userIds.map(id => String(id)).filter(Boolean))];
  if (!uniqueIds.length) {
    return { sent: 0, skipped: true };
  }

  if (persistNotification) {
    const docs = uniqueIds.map((userId) => ({
      userId,
      title: String(title || 'Notification'),
      message: String(body || ''),
      type: String(type || 'general'),
      data: normalizeData(data),
    }));
    try {
      await Notification.insertMany(docs, { ordered: false });
    } catch {}
  }

  if (!admin) {
    return { sent: 0, skipped: true };
  }

  const users = await User.find({ _id: { $in: uniqueIds } })
    .select({ _id: 1, fcmTokens: 1 })
    .lean();

  const tokens = users
    .flatMap(user => (Array.isArray(user.fcmTokens) ? user.fcmTokens : []))
    .map(token => String(token).trim())
    .filter(Boolean);

  if (!tokens.length) {
    return { sent: 0, skipped: true };
  }

  const uniqueTokens = [...new Set(tokens)];
  const message = {
    tokens: uniqueTokens,
    notification: { title, body },
    data: normalizeData(data),
    android: {
      priority: 'high',
      notification: {
        channelId: 'csp_default',
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  const invalidTokens = [];
  response.responses.forEach((result, index) => {
    if (result.success) return;
    const code = result.error && result.error.code;
    if (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered'
    ) {
      invalidTokens.push(uniqueTokens[index]);
    }
  });

  if (invalidTokens.length) {
    await User.updateMany(
      { fcmTokens: { $in: invalidTokens } },
      { $pull: { fcmTokens: { $in: invalidTokens } } }
    );
  }

  return { sent: response.successCount, failed: response.failureCount };
};

module.exports = {
  sendToUserIds,
};
