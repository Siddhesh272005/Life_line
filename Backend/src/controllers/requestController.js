const Request = require('../models/Request');
const User = require('../models/User');
const CivilianProfile = require('../models/CivilianProfile');
const asyncHandler = require('../utils/asyncHandler');
const { sendToUserIds } = require('../services/notifications');

const DONATION_INTERVAL_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RESPONDER_HOLD_MINUTES = 45;

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

  if (a.length === 4 && bNum >= 1 && bNum <= 12 && cNum >= 1 && cNum <= 31) {
    return new Date(aNum, bNum - 1, cNum);
  }
  if (c.length === 4 && bNum >= 1 && bNum <= 12 && aNum >= 1 && aNum <= 31) {
    return new Date(cNum, bNum - 1, aNum);
  }
  if (c.length === 4 && aNum >= 1 && aNum <= 12 && bNum >= 1 && bNum <= 31) {
    return new Date(cNum, aNum - 1, bNum);
  }

  return null;
};

const toIdString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const normalizeResponder = (item, fallbackDate) => {
  if (!item) return null;

  // Backward compatibility with legacy responder ObjectId array entries.
  if (typeof item === 'string' || (typeof item === 'object' && item.constructor?.name === 'ObjectId')) {
    const userId = toIdString(item);
    if (!userId) return null;
    return {
      userId,
      status: 'responded',
      respondedAt: fallbackDate || new Date(),
      donatedAt: null,
      expiresAt: null,
    };
  }

  const userId = toIdString(item.userId || item._id || item.id);
  if (!userId) return null;

  const respondedAt = item.respondedAt ? new Date(item.respondedAt) : fallbackDate || new Date();
  const donatedAt = item.donatedAt ? new Date(item.donatedAt) : null;
  const expiresAt = item.expiresAt ? new Date(item.expiresAt) : null;

  return {
    userId,
    status: item.status || 'responded',
    respondedAt,
    donatedAt,
    expiresAt,
  };
};

const isExpiredResponder = (responder, now = new Date()) =>
  responder.status === 'responded' &&
  responder.expiresAt instanceof Date &&
  responder.expiresAt.getTime() <= now.getTime();

const getResponderStats = (responders, requiredUnits, currentUserId) => {
  const now = new Date();
  const normalized = (Array.isArray(responders) ? responders : [])
    .map(item => normalizeResponder(item, now))
    .filter(Boolean)
    .map((responder) => {
      if (isExpiredResponder(responder, now)) {
        return { ...responder, status: 'expired' };
      }
      return responder;
    });

  const activeReservations = normalized.filter(r => r.status === 'responded');
  const donatedResponders = normalized.filter(r => r.status === 'donated');
  const reservedUnits = Math.max(0, requiredUnits - donatedResponders.length);
  const slotsRemaining = Math.max(0, reservedUnits - activeReservations.length);

  const currentResponder = normalized.find(
    responder => currentUserId && responder.userId === String(currentUserId)
  );
  const hasResponded = Boolean(
    currentResponder &&
    (currentResponder.status === 'responded' || currentResponder.status === 'donated')
  );
  const hasDonated = Boolean(currentResponder && currentResponder.status === 'donated');

  return {
    normalized,
    activeReservations,
    donatedResponders,
    slotsRemaining,
    hasResponded,
    hasDonated,
    currentResponderStatus: currentResponder?.status || null,
    currentResponderExpiresAt: currentResponder?.expiresAt || null,
  };
};

const serializeRequest = (requestDoc, currentUserId) => {
  const request =
    requestDoc && typeof requestDoc.toObject === 'function'
      ? requestDoc.toObject()
      : requestDoc;

  const respondersLimitRaw = Number(request?.units || 1);
  const respondersLimit = Number.isFinite(respondersLimitRaw)
    ? Math.max(1, Math.floor(respondersLimitRaw))
    : 1;
  const responderStats = getResponderStats(request?.responders, respondersLimit, currentUserId);
  const donatedUnits = Array.isArray(request?.donations)
    ? request.donations.length
    : Number(request?.donatedUnits || 0);

  return {
    ...request,
    responders: responderStats.normalized.map(r => ({
      userId: r.userId,
      status: r.status,
      respondedAt: r.respondedAt,
      donatedAt: r.donatedAt,
      expiresAt: r.expiresAt,
    })),
    respondersCount: responderStats.activeReservations.length,
    respondersLimit,
    donatedUnits,
    slotsRemaining: responderStats.slotsRemaining,
    hasResponded: responderStats.hasResponded,
    hasDonated: responderStats.hasDonated,
    currentResponderStatus: responderStats.currentResponderStatus,
    currentResponderExpiresAt: responderStats.currentResponderExpiresAt,
  };
};

const createRequest = asyncHandler(async (req, res) => {
  const data = req.body;
  if (!data.patientName || !data.bloodGroup || !data.condition || !data.location) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (
    !Array.isArray(data.location.coordinates) ||
    data.location.coordinates.length !== 2
  ) {
    return res.status(400).json({ message: 'Invalid location coordinates' });
  }
  const request = await Request.create({
    ...data,
    createdBy: req.user._id,
    location: {
      type: 'Point',
      coordinates: data.location.coordinates,
    },
  });
  res.status(201).json(serializeRequest(request, req.user?._id));
});

const listRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find().sort({ createdAt: -1 });
  res.json(requests.map(item => serializeRequest(item, req.user?._id)));
});

const listMyRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.json(requests.map(item => serializeRequest(item, req.user?._id)));
});

const listMyDonations = asyncHandler(async (req, res) => {
  const userId = String(req.user._id);
  const requests = await Request.find({
    responders: {
      $elemMatch: {
        userId: req.user._id,
        status: { $in: ['responded', 'donated'] },
      },
    },
  }).sort({ updatedAt: -1 });

  const serialized = requests
    .map(item => serializeRequest(item, req.user?._id))
    .map(item => {
      const responder = Array.isArray(item.responders)
        ? item.responders.find(r => String(r?.userId) === userId)
        : null;
      return {
        ...item,
        myDonationStatus: responder?.status || null,
        myRespondedAt: responder?.respondedAt || null,
        myDonatedAt: responder?.donatedAt || null,
      };
    });

  res.json(serialized);
});

const getRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.json(serializeRequest(request, req.user?._id));
});

const updateRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Not found' });
  }
  if (String(request.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const next = { ...req.body };
  if (next.location && Array.isArray(next.location.coordinates)) {
    next.location = {
      type: 'Point',
      coordinates: next.location.coordinates,
    };
  }
  Object.assign(request, next);
  if (request.location && Array.isArray(request.location.coordinates)) {
    request.location = {
      type: 'Point',
      coordinates: request.location.coordinates,
    };
  }
  await request.save();
  res.json(serializeRequest(request, req.user?._id));
});

const deleteRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Not found' });
  }
  if (String(request.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await request.deleteOne();
  res.json({ message: 'Deleted' });
});

const respondToRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Not found' });
  }
  if (request.status === 'closed') {
    return res.status(400).json({ message: 'This request is already closed' });
  }
  if (req.user.role === 'civilian') {
    const profile = await CivilianProfile.findOne({ userId: req.user._id }).lean();
    const lastDonationDate = parseDateString(profile?.lastDonation);
    if (lastDonationDate) {
      const now = new Date();
      const daysSince = Math.floor((now.getTime() - lastDonationDate.getTime()) / MS_PER_DAY);
      if (daysSince < DONATION_INTERVAL_DAYS) {
        const nextDonationDate = new Date(
          lastDonationDate.getTime() + DONATION_INTERVAL_DAYS * MS_PER_DAY
        );
        return res.status(403).json({
          message: `You are not eligible to respond yet. Next eligible date: ${nextDonationDate.toISOString()}`,
        });
      }
    }
  }

  const requiredUnitsRaw = Number(request.units || 1);
  const requiredUnits = Number.isFinite(requiredUnitsRaw)
    ? Math.max(1, Math.floor(requiredUnitsRaw))
    : 1;
  const responderStats = getResponderStats(request.responders, requiredUnits, req.user._id);
  const responders = responderStats.normalized;
  const responderIndex = responders.findIndex(
    responder => responder.userId === String(req.user._id)
  );
  const existing = responderIndex >= 0 ? responders[responderIndex] : null;
  if (existing && existing.status === 'donated') {
    return res.status(409).json({ message: 'You have already donated for this request' });
  }
  if (existing && existing.status === 'responded') {
    return res.json(serializeRequest(request, req.user?._id));
  }

  if (responderStats.slotsRemaining <= 0) {
    return res.status(409).json({ message: 'Responder limit reached for this request' });
  }
  const holdUntil = new Date(Date.now() + RESPONDER_HOLD_MINUTES * 60 * 1000);
  const nextResponder = {
    userId: req.user._id,
    status: 'responded',
    respondedAt: new Date(),
    donatedAt: null,
    expiresAt: holdUntil,
  };
  if (responderIndex >= 0) {
    responders[responderIndex] = nextResponder;
  } else {
    responders.push(nextResponder);
  }
  request.responders = responders;
  const activeAfter = getResponderStats(responders, requiredUnits, req.user._id).activeReservations.length;
  request.status = activeAfter > 0 ? 'responded' : 'open';
  await request.save();

  try {
    const requester = await User.findById(request.createdBy).select('_id role').lean();
    if (
      requester &&
      (requester.role === 'hospital' || requester.role === 'ngo') &&
      String(requester._id) !== String(req.user._id)
    ) {
      await sendToUserIds({
        userIds: [requester._id],
        title: 'New Responder',
        body: `${req.user.name || 'A donor'} responded to ${request.patientName || 'your request'}.`,
        data: {
          type: 'request_responded',
          requestId: request._id,
        },
      });
    }
  } catch (err) {
    console.error('Push notification failed in respondToRequest:', err.message || err);
  }

  res.json(serializeRequest(request, req.user?._id));
});

const markDonation = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id).populate('createdBy', 'role');
  if (!request) {
    return res.status(404).json({ message: 'Not found' });
  }

  const isRequester = String(request.createdBy?._id || request.createdBy) === String(req.user._id);
  const requiredUnitsRaw = Number(request.units || 1);
  const requiredUnits = Number.isFinite(requiredUnitsRaw)
    ? Math.max(1, Math.floor(requiredUnitsRaw))
    : 1;
  const responderStats = getResponderStats(request.responders, requiredUnits, req.user._id);
  const isResponder = responderStats.normalized.some(
    responder => responder.userId === String(req.user._id)
  );

  if (!isRequester && !isResponder) {
    return res.status(403).json({ message: 'Only requester or responder can confirm donation' });
  }

  if (request.status === 'closed') {
    return res.status(400).json({ message: 'Donation has already been confirmed for this request' });
  }

  const donorUserId = req.body?.donorUserId || req.user._id;
  if (!isRequester && String(donorUserId) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only confirm your own donation' });
  }

  const donorResponder = responderStats.normalized.find(
    responder => responder.userId === String(donorUserId)
  );
  const donorIsResponder = Boolean(
    donorResponder &&
    (donorResponder.status === 'responded' || donorResponder.status === 'donated')
  );
  if (!donorIsResponder) {
    return res.status(400).json({ message: 'Donor must be one of the responders' });
  }

  const donor = await User.findById(donorUserId).select('name email phone role');
  if (!donor) {
    return res.status(404).json({ message: 'Donor not found' });
  }

  const donations = Array.isArray(request.donations) ? request.donations : [];
  const alreadyMarked = donations.some(
    item => String(item?.donorUserId) === String(donor._id)
  );
  if (alreadyMarked) {
    return res.status(409).json({ message: 'Donation already confirmed for this donor' });
  }

  const donationDetails = {
    name: donor.name || '',
    email: donor.email || '',
    phone: donor.phone || '',
    role: donor.role || 'civilian',
  };
  request.donations.push({
    donorUserId: donor._id,
    donatedAt: new Date(),
    donorDetails: donationDetails,
  });
  request.donatedUnits = request.donations.length;

  // Keep legacy single-donor fields in sync with the latest donation.
  request.donatedBy = donor._id;
  request.donatedAt = new Date();
  request.donorDetails = donationDetails;

  const responders = getResponderStats(request.responders, requiredUnits, req.user._id).normalized;
  const donorResponderIndex = responders.findIndex(
    responder => responder.userId === String(donor._id)
  );
  if (donorResponderIndex >= 0) {
    responders[donorResponderIndex] = {
      ...responders[donorResponderIndex],
      status: 'donated',
      donatedAt: new Date(),
      expiresAt: null,
    };
  }
  request.responders = responders;
  request.status = request.donatedUnits >= requiredUnits ? 'closed' : 'responded';

  await request.save();
  if (donor.role === 'civilian') {
    await CivilianProfile.findOneAndUpdate(
      { userId: donor._id },
      { $set: { lastDonation: new Date().toISOString() } },
      { new: true }
    );
  }

  const requesterRole = request.createdBy?.role;
  const notifyRequester = requesterRole === 'hospital' || requesterRole === 'ngo';

  try {
    if (notifyRequester && String(request.createdBy?._id || request.createdBy) !== String(req.user._id)) {
      await sendToUserIds({
        userIds: [request.createdBy?._id || request.createdBy],
        title: 'Donation Confirmed',
        body: `${request.patientName || 'A request'} now has ${request.donatedUnits}/${requiredUnits} donated units.`,
        data: {
          type: 'donation_confirmed',
          requestId: request._id,
          donorUserId: donor._id,
        },
      });
    }

    if (String(donor._id) !== String(req.user._id)) {
      await sendToUserIds({
        userIds: [donor._id],
        title: 'Donation Logged',
        body: `Your donation for ${request.patientName || 'a patient'} has been confirmed.`,
        data: {
          type: 'donation_logged',
          requestId: request._id,
        },
      });
    }
  } catch (err) {
    console.error('Push notification failed in markDonation:', err.message || err);
  }

  res.json({
    message: notifyRequester
      ? `Donation confirmed (${request.donatedUnits}/${requiredUnits} units). Donor details sent to ${requesterRole.toUpperCase()} for certificate processing.`
      : 'Donation confirmed successfully.',
    notifyRequester,
    donor: {
      id: donor._id,
      name: donor.name || '',
      email: donor.email || '',
      phone: donor.phone || '',
      role: donor.role || 'civilian',
    },
    request: serializeRequest(request, req.user?._id),
  });
});

module.exports = {
  createRequest,
  listRequests,
  listMyRequests,
  listMyDonations,
  getRequest,
  updateRequest,
  deleteRequest,
  respondToRequest,
  markDonation,
};
