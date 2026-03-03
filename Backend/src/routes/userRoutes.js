const express = require('express');
const {
  me,
  updateMe,
  deleteMe,
  getDashboard,
  getRewards,
  getNotifications,
  notifySmartSearchDonors,
  markNotificationRead,
  clearNotifications,
  registerPushToken,
  unregisterPushToken,
  searchDonors,
  listDonors,
} = require('../controllers/userController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/me', auth, me);
router.put('/me', auth, updateMe);
router.delete('/me', auth, deleteMe);
router.get('/dashboard', auth, getDashboard);
router.get('/rewards', auth, getRewards);
router.get('/notifications', auth, getNotifications);
router.post('/donors/notify', auth, notifySmartSearchDonors);
router.get('/donors/search', auth, searchDonors);
router.put('/notifications/read', auth, markNotificationRead);
router.put('/notifications/clear', auth, clearNotifications);
router.put('/push-token', auth, registerPushToken);
router.delete('/push-token', auth, unregisterPushToken);
router.get('/donors', auth, listDonors);

module.exports = router;
