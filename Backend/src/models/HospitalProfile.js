const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    licenseId: String,
    contactPerson: String,
    city: String,
    address: String,
    pincode: String,
  },
  { timestamps: true, collection: 'hospitals' }
);

module.exports = mongoose.model('HospitalProfile', hospitalSchema);
