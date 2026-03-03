const mongoose = require('mongoose');
const REQUEST_TTL_SECONDS = 24 * 60 * 60;

const requestSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    condition: { type: String, required: true },
    requestType: { type: String },
    hospitalName: { type: String },
    units: { type: Number, default: 1 },
    phone: { type: String },
    address: { type: String },
    notes: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    responders: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          status: {
            type: String,
            enum: ['responded', 'donated', 'cancelled', 'expired'],
            default: 'responded',
          },
          respondedAt: { type: Date, default: Date.now },
          donatedAt: { type: Date },
          expiresAt: { type: Date },
        },
      ],
      default: [],
    },
    donatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donatedAt: { type: Date },
    donorDetails: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      role: { type: String, enum: ['civilian', 'hospital', 'ngo'] },
    },
    donations: {
      type: [
        {
          donorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          donatedAt: { type: Date, default: Date.now },
          donorDetails: {
            name: { type: String },
            email: { type: String },
            phone: { type: String },
            role: { type: String, enum: ['civilian', 'hospital', 'ngo'] },
          },
        },
      ],
      default: [],
    },
    donatedUnits: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'responded', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

requestSchema.index({ location: '2dsphere' });
requestSchema.index({ createdAt: 1 }, { expireAfterSeconds: REQUEST_TTL_SECONDS });

module.exports = mongoose.model('Request', requestSchema);
