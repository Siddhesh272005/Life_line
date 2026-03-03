const CivilianProfile = require('../models/CivilianProfile');
const HospitalProfile = require('../models/HospitalProfile');
const NgoProfile = require('../models/NgoProfile');
const User = require('../models/User');
const Request = require('../models/Request');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { sendToUserIds } = require('../services/notifications');

const DONATION_INTERVAL_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const parts = raw.split(/[/.-]/).map(p => p.trim()).filter(Boolean);
  if (parts.length !== 3) return null;

  const [a, b, c] = parts;
  const aNum = parseInt(a, 10);
  const bNum = parseInt(b, 10);
  const cNum = parseInt(c, 10);
  if (Number.isNaN(aNum) || Number.isNaN(bNum) || Number.isNaN(cNum)) return null;

  // yyyy-mm-dd
  if (a.length === 4 && bNum >= 1 && bNum <= 12 && cNum >= 1 && cNum <= 31) {
    return new Date(aNum, bNum - 1, cNum);
  }

  // dd-mm-yyyy (or mm-dd-yyyy). Prefer day-first unless impossible.
  if (c.length === 4 && bNum >= 1 && bNum <= 12 && aNum >= 1 && aNum <= 31) {
    return new Date(cNum, bNum - 1, aNum);
  }
  if (c.length === 4 && aNum >= 1 && aNum <= 12 && bNum >= 1 && bNum <= 31) {
    return new Date(cNum, aNum - 1, bNum);
  }

  return null;
};

const getProfileModelForRole = (role) => {
  if (role === 'civilian') return CivilianProfile;
  if (role === 'hospital') return HospitalProfile;
  if (role === 'ngo') return NgoProfile;
  return null;
};

const getProfileByRole = async (user) => {
  const Model = getProfileModelForRole(user.role);
  if (!Model) return null;
  return Model.findOne({ userId: user._id });
};

const enrichCivilianEligibility = (profileOut) => {
  if (!profileOut?.lastDonation) return profileOut;
  const lastDate = parseDateString(profileOut.lastDonation);
  if (!lastDate) return profileOut;
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / MS_PER_DAY);
  const nextDonationDate = new Date(lastDate.getTime() + DONATION_INTERVAL_DAYS * MS_PER_DAY);
  const daysRemaining = Math.max(0, Math.ceil((nextDonationDate.getTime() - now.getTime()) / MS_PER_DAY));
  return {
    ...profileOut,
    eligibility: {
      eligible: daysSince >= DONATION_INTERVAL_DAYS,
      lastDonation: lastDate.toISOString(),
      nextDonationDate: nextDonationDate.toISOString(),
      daysSince,
      daysRemaining,
      intervalDays: DONATION_INTERVAL_DAYS,
    },
  };
};

const me = asyncHandler(async (req, res) => {
  const profile = await getProfileByRole(req.user);
  let profileOut = profile ? profile.toObject() : null;

  if (req.user.role === 'civilian') {
    profileOut = enrichCivilianEligibility(profileOut);
  }

  res.json({ user: req.user, profile: profileOut });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, profile } = req.body || {};
  if (typeof name === 'string' && name.trim()) {
    req.user.name = name.trim();
  }
  if (typeof phone === 'string') {
    req.user.phone = phone.trim();
  }
  await req.user.save();

  const Model = getProfileModelForRole(req.user.role);
  let profileDoc = null;
  if (Model && profile && typeof profile === 'object') {
    profileDoc = await Model.findOne({ userId: req.user._id });
    if (!profileDoc) {
      profileDoc = await Model.create({ userId: req.user._id, ...profile });
    } else {
      Object.assign(profileDoc, profile);
      await profileDoc.save();
    }
  } else {
    profileDoc = await getProfileByRole(req.user);
  }

  let profileOut = profileDoc ? profileDoc.toObject() : null;
  if (req.user.role === 'civilian') {
    profileOut = enrichCivilianEligibility(profileOut);
  }
  res.json({ user: req.user, profile: profileOut });
});

const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const Model = getProfileModelForRole(req.user.role);

  if (Model) {
    await Model.deleteOne({ userId });
  }

  await Request.updateMany(
    { responders: userId },
    { $pull: { responders: userId } }
  );
  await Request.updateMany(
    { 'responders.userId': userId },
    { $pull: { responders: { userId } } }
  );
  await Request.updateMany(
    { 'donations.donorUserId': userId },
    { $pull: { donations: { donorUserId: userId } } }
  );
  await Request.updateMany(
    { donatedBy: userId },
    {
      $unset: {
        donatedBy: 1,
        donatedAt: 1,
        donorDetails: 1,
      },
    }
  );

  await Request.deleteMany({ createdBy: userId });
  await Certificate.deleteMany({
    $or: [{ donorUserId: userId }, { issuedBy: userId }],
  });
  await User.deleteOne({ _id: userId });

  res.json({ message: 'Account deleted successfully' });
});

const getDashboard = asyncHandler(async (req, res) => {
  const profileDoc = await getProfileByRole(req.user);
  let profile = profileDoc ? profileDoc.toObject() : null;
  if (req.user.role === 'civilian') {
    profile = enrichCivilianEligibility(profile);
  }

  if (req.user.role === 'civilian') {
    const eligibility = profile?.eligibility;
    // If last donation date is missing/invalid, treat the donor as eligible now.
    const hasComputedEligibility = Boolean(eligibility && eligibility.lastDonation);
    const isEligible = hasComputedEligibility ? Boolean(eligibility.eligible) : true;
    const nextDonationDate = isEligible ? '' : eligibility?.nextDonationDate || '';
    const certCount = await Certificate.countDocuments({ donorUserId: req.user._id, status: 'issued' });
    return res.json({
      role: req.user.role,
      name: req.user.name,
      badge: profile?.bloodGroup || '',
      stats: [
        {
          label: 'Donation Eligibility',
          value: isEligible ? 'Eligible' : 'Not Eligible',
        },
        {
          label: isEligible ? '' : 'Next Donation',
          value: nextDonationDate,
        },
      ],
      counters: {
        certificatesEarned: certCount,
      },
    });
  }

  const totalRequests = await Request.countDocuments({ createdBy: req.user._id });
  const respondedRequests = await Request.countDocuments({
    createdBy: req.user._id,
    $or: [
      { 'responders.0': { $exists: true } },
      { status: 'responded' },
      { status: 'closed' },
    ],
  });
  const openRequests = await Request.countDocuments({ createdBy: req.user._id, status: 'open' });
  const successRate = totalRequests > 0 ? Math.round((respondedRequests / totalRequests) * 100) : 0;

  return res.json({
    role: req.user.role,
    name: req.user.name,
    stats: [
      {
        label: 'Active Requests',
        value: String(openRequests),
      },
      {
        label: 'Success Rate',
        value: `${successRate}%`,
      },
    ],
    counters: {
      totalRequests,
      respondedRequests,
      openRequests,
      successRate,
    },
  });
});

const getRewards = asyncHandler(async (req, res) => {
  let points = 0;
  let offers = [];
  if (req.user.role === 'civilian') {
    const certCount = await Certificate.countDocuments({
      donorUserId: req.user._id,
      status: 'issued',
    });
    points = certCount * 50;
    const certs = await Certificate.find({ donorUserId: req.user._id, status: 'issued' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    offers = certs.map((cert) => ({
      id: String(cert._id),
      name: cert.title || 'Donation Reward',
      points: 50,
      image: 'health',
    }));
  } else {
    const issuedCount = await Certificate.countDocuments({
      issuedBy: req.user._id,
      status: 'issued',
    });
    points = issuedCount * 25;
    const issued = await Certificate.find({ issuedBy: req.user._id, status: 'issued' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    offers = issued.map((cert) => ({
      id: String(cert._id),
      name: cert.title || 'Service Reward',
      points: 25,
      image: 'health',
    }));
  }

  res.json({ role: req.user.role, points, offers });
});

const getNotifications = asyncHandler(async (req, res) => {
  const readNotificationIds = new Set(
    Array.isArray(req.user.readNotificationIds) ? req.user.readNotificationIds : []
  );
  const clearedAt = req.user.notificationsClearedAt
    ? new Date(req.user.notificationsClearedAt)
    : null;
  const notifications = [];

  if (req.user.role === 'civilian') {
    const certs = await Certificate.find({ donorUserId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('issuedBy', 'name')
      .lean();

    certs.forEach((cert) => {
      notifications.push({
        id: `cert-${cert._id}`,
        title: 'Certificate Update',
        message: `${cert.title || 'Certificate'} issued by ${cert.issuedBy?.name || 'Hospital/NGO'}.`,
        date: cert.createdAt,
        read: false,
      });
    });
  } else {
    const requests = await Request.find({ createdBy: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('donatedBy', 'name phone email')
      .lean();

    requests.forEach((request) => {
      const donorName = request.donorDetails?.name || request.donatedBy?.name || '';
      const donorPhone = request.donorDetails?.phone || request.donatedBy?.phone || '';
      const hasDonation = request.status === 'closed' && Boolean(request.donatedBy);

      notifications.push({
        id: `req-${request._id}`,
        title: hasDonation ? 'Donation Confirmed' : 'Request Status',
        message: hasDonation
          ? `${request.patientName} donation completed by ${donorName || 'a donor'}${donorPhone ? ` (${donorPhone})` : ''}. Proceed with certificate verification.`
          : `${request.patientName} request is currently ${request.status}.`,
        date: request.updatedAt || request.createdAt,
        read: false,
      });
    });

    const issued = await Certificate.find({ issuedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('donorUserId', 'name')
      .lean();

    issued.forEach((cert) => {
      notifications.push({
        id: `issued-${cert._id}`,
        title: 'Certificate Issued',
        message: `${cert.title || 'Certificate'} issued for ${cert.donorUserId?.name || 'donor'}.`,
        date: cert.createdAt,
        read: false,
      });
    });
  }

  const userNotifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  userNotifications.forEach((item) => {
    notifications.push({
      id: `notif-${item._id}`,
      title: item.title || 'Notification',
      message: item.message || '',
      date: item.createdAt,
      read: false,
    });
  });

  const filtered = notifications
    .filter((item) => {
      if (!clearedAt) return true;
      const itemDate = new Date(item.date);
      return itemDate.getTime() > clearedAt.getTime();
    })
    .map((item) => ({
      ...item,
      read: readNotificationIds.has(item.id),
    }));

  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(filtered.slice(0, 20));
});

const notifySmartSearchDonors = asyncHandler(async (req, res) => {
  if (req.user.role !== 'hospital' && req.user.role !== 'ngo') {
    return res.status(403).json({ message: 'Only hospital/NGO users can notify donors' });
  }

  const donorUserIds = Array.isArray(req.body?.donorUserIds)
    ? req.body.donorUserIds.map((id) => String(id)).filter(Boolean)
    : [];

  if (!donorUserIds.length) {
    return res.status(400).json({ message: 'At least one donor is required' });
  }

  const uniqueDonorIds = [...new Set(donorUserIds)].slice(0, 100);
  const donors = await User.find({ _id: { $in: uniqueDonorIds }, role: 'civilian' })
    .select({ _id: 1 })
    .lean();
  const validDonorIds = donors.map((donor) => donor._id);

  if (!validDonorIds.length) {
    return res.status(400).json({ message: 'No valid civilian donors selected' });
  }

  const bloodGroup = typeof req.body?.bloodGroup === 'string' ? req.body.bloodGroup.trim() : '';
  const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
  const requestedBlood = bloodGroup || 'required blood group';
  const requestedLocation = location || 'your area';
  const title = 'Urgent Blood Request';
  const message = `${req.user.name || 'A requester'} needs ${requestedBlood} donors near ${requestedLocation}.`;

  await sendToUserIds({
    userIds: validDonorIds,
    title,
    body: message,
    type: 'smart_donor_search',
    persistNotification: false,
    data: {
      type: 'smart_donor_search',
      bloodGroup,
      location,
      requesterId: req.user._id,
    },
  });

  const notificationDocs = validDonorIds.map((userId) => ({
    userId,
    title,
    message,
    type: 'smart_donor_search',
    data: {
      requesterId: String(req.user._id),
      bloodGroup,
      location,
    },
  }));
  await Notification.insertMany(notificationDocs, { ordered: false });

  return res.json({
    message: 'Notifications sent to selected donors',
    notifiedCount: validDonorIds.length,
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const id = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
  if (!id) {
    return res.status(400).json({ message: 'Notification id is required' });
  }

  await User.updateOne(
    { _id: req.user._id },
    { $addToSet: { readNotificationIds: id } }
  );

  return res.json({ message: 'Notification marked as read' });
});

const clearNotifications = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user._id },
    {
      $set: { notificationsClearedAt: new Date(), readNotificationIds: [] },
    }
  );

  return res.json({ message: 'Notifications cleared' });
});

const registerPushToken = asyncHandler(async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  await User.updateOne(
    { _id: req.user._id },
    { $addToSet: { fcmTokens: token } }
  );

  return res.json({ message: 'Push token registered' });
});

const unregisterPushToken = asyncHandler(async (req, res) => {
  const token = typeof req.query?.token === 'string' ? req.query.token.trim() : '';
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  await User.updateOne(
    { _id: req.user._id },
    { $pull: { fcmTokens: token } }
  );

  return res.json({ message: 'Push token removed' });
});

const searchDonors = asyncHandler(async (req, res) => {
  const bloodGroup = typeof req.query.bloodGroup === 'string' ? req.query.bloodGroup.trim() : '';
  const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';

  const profileFilter = {};
  if (bloodGroup) {
    profileFilter.bloodGroup = new RegExp(`^${escapeRegex(bloodGroup)}$`, 'i');
  }
  if (location) {
    const safeLocation = escapeRegex(location);
    profileFilter.$or = [
      { city: new RegExp(safeLocation, 'i') },
      { address: new RegExp(safeLocation, 'i') },
    ];
  }

  const profiles = await CivilianProfile.find(profileFilter).limit(100).lean();
  const userIds = profiles.map(p => p.userId).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds }, role: 'civilian' })
    .select({ _id: 1, name: 1 })
    .lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));

  const donors = profiles
    .map(profile => {
      const user = userMap.get(String(profile.userId));
      if (!user) return null;
      return {
        id: String(user._id),
        name: user.name || 'Donor',
        place: profile.city || profile.address || 'Unknown',
        bloodGroup: profile.bloodGroup || '',
      };
    })
    .filter(Boolean);

  res.json(donors);
});

const listDonors = asyncHandler(async (req, res) => {
  if (req.user.role === 'hospital' || req.user.role === 'ngo') {
    const donationReadyRequests = await Request.find({
      createdBy: req.user._id,
      $or: [
        { donatedBy: { $exists: true, $ne: null } },
        { 'donations.0': { $exists: true } },
      ],
    })
      .sort({ updatedAt: -1 })
      .populate('donatedBy', 'name email phone role')
      .populate('donations.donorUserId', 'name email phone role')
      .lean();

    const requestIds = donationReadyRequests.map(r => r._id);
    const issuedCertificates = requestIds.length
      ? await Certificate.find({
          issuedBy: req.user._id,
          requestId: { $in: requestIds },
          status: 'issued',
        })
          .select({ requestId: 1, donorUserId: 1 })
          .lean()
      : [];
    const issuedPairSet = new Set(
      issuedCertificates.map(cert => `${String(cert.requestId)}:${String(cert.donorUserId)}`)
    );

    const pendingDonors = donationReadyRequests
      .flatMap(request => {
        const donationItems = Array.isArray(request?.donations) && request.donations.length
          ? request.donations
          : [
              {
                donorUserId: request?.donatedBy,
                donatedAt: request?.donatedAt,
                donorDetails: request?.donorDetails || null,
              },
            ];

        return donationItems.map(donation => {
          const donorUser = donation?.donorUserId;
          const donorId = donorUser?._id || donorUser;
          const donorRole = donation?.donorDetails?.role || donorUser?.role;
          const donorName =
            donation?.donorDetails?.name || donorUser?.name || 'Donor';
          const donorPhone =
            donation?.donorDetails?.phone || donorUser?.phone || '';
          const donorEmail =
            donation?.donorDetails?.email || donorUser?.email || '';
          const pairKey = `${String(request._id)}:${String(donorId)}`;
          if (!donorId || donorRole !== 'civilian' || issuedPairSet.has(pairKey)) {
            return null;
          }
          return {
            id: pairKey,
            requestId: String(request._id),
            donorUserId: String(donorId),
            name: donorName,
            phone: donorPhone,
            email: donorEmail,
            bloodGroup: request.bloodGroup || '',
            place: request.address || request.hospitalName || 'Unknown',
            patientName: request.patientName || '',
            donatedAt: donation?.donatedAt || request.updatedAt || request.createdAt,
          };
        });
      })
      .filter(item => Boolean(item && item.donorUserId));

    return res.json(pendingDonors);
  }
  return searchDonors(req, res);
});

module.exports = {
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
};
