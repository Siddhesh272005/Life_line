const { Readable } = require('stream');
const Certificate = require('../models/Certificate');
const Request = require('../models/Request');
const asyncHandler = require('../utils/asyncHandler');
const { getBucket } = require('../config/db');
const { sendToUserIds } = require('../services/notifications');

const uploadCertificate = asyncHandler(async (req, res) => {
  const { donorUserId, requestId, title } = req.body;
  if (!req.file || !donorUserId || !requestId || !title) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const request = await Request.findById(requestId).populate('donatedBy', 'name email phone role');
  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (String(request.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can issue certificates only for your own requests' });
  }
  let donationEntries = Array.isArray(request.donations) ? request.donations : [];
  if (!donationEntries.length && request.donatedBy) {
    donationEntries = [
      {
        donorUserId: request.donatedBy,
        donatedAt: request.donatedAt || request.updatedAt || request.createdAt,
        donorDetails: request.donorDetails || null,
      },
    ];
  }
  if (!donationEntries.length) {
    return res.status(400).json({ message: 'Certificate can be uploaded only after donation is confirmed' });
  }
  const matchedDonation = donationEntries.find(
    entry => String(entry?.donorUserId) === String(donorUserId)
  );
  if (!matchedDonation) {
    return res.status(400).json({ message: 'Selected donor does not match this request donations' });
  }
  const donorRole =
    matchedDonation?.donorDetails?.role ||
    matchedDonation?.donorUserId?.role ||
    request?.donorDetails?.role;
  if (donorRole && donorRole !== 'civilian') {
    return res.status(400).json({ message: 'Certificate can be issued only to civilian donors' });
  }

  const existing = await Certificate.findOne({
    issuedBy: req.user._id,
    requestId,
    donorUserId,
    status: 'issued',
  }).lean();
  if (existing) {
    return res.status(409).json({ message: 'Certificate already uploaded for this donor and request' });
  }

  const bucket = getBucket();
  const stream = Readable.from(req.file.buffer);
  const uploadStream = bucket.openUploadStream(req.file.originalname, {
    contentType: req.file.mimetype,
    metadata: { donorUserId, issuedBy: req.user._id, requestId },
  });
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    uploadStream.on('error', reject);
    uploadStream.on('finish', resolve);
    stream.pipe(uploadStream);
  });

  const certificate = await Certificate.create({
    title,
    donorUserId,
    issuedBy: req.user._id,
    requestId: requestId || null,
    fileId: uploadStream.id,
    fileName: uploadStream.filename || req.file.originalname,
    status: 'issued',
  });

  try {
    await sendToUserIds({
      userIds: [donorUserId],
      title: 'Certificate Issued',
      body: `${title || 'Your certificate'} is now available to download.`,
      data: {
        type: 'certificate_issued',
        certificateId: certificate._id,
        requestId,
      },
    });
  } catch (err) {
    console.error('Push notification failed in uploadCertificate:', err.message || err);
  }

  res.status(201).json(certificate);
});

const listMyCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ donorUserId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('issuedBy', 'name role')
    .lean();
  res.json(certs);
});

const listIssuedCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ issuedBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate('donorUserId', 'name')
    .lean();
  res.json(certs);
});

const downloadCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) {
    return res.status(404).json({ message: 'Not found' });
  }
  const isOwner = cert.donorUserId.toString() === req.user._id.toString();
  const isIssuer = cert.issuedBy.toString() === req.user._id.toString();
  if (!isOwner && !isIssuer) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const bucket = getBucket();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${cert.fileName}"`);
  bucket.openDownloadStream(cert.fileId).pipe(res);
});

module.exports = {
  uploadCertificate,
  listMyCertificates,
  listIssuedCertificates,
  downloadCertificate,
};
