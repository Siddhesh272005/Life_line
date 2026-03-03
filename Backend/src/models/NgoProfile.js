const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    licenseId: String,
    contactPerson: String,
    city: String,
    address: String,
    pincode: String,
  },
  { timestamps: true, collection: 'ngos' }
);

module.exports = mongoose.model('NgoProfile', ngoSchema);
