const mongoose = require('mongoose');

const civilianSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bloodGroup: String,
    gender: String,
    dob: String,
    age: Number,
    city: String,
    address: String,
    lastDonation: String,
  },
  { timestamps: true, collection: 'civilians' }
);

module.exports = mongoose.model('CivilianProfile', civilianSchema);
