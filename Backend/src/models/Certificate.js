const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    donorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true },
    status: { type: String, enum: ['issued', 'pending'], default: 'issued' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
