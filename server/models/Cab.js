const mongoose = require('mongoose');

const cabSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  driver: { type: String },
  capacity: { type: Number, default: 4 },
  isAvailable: { type: Boolean, default: true },
  currentLocation: { type: String }
});

module.exports = mongoose.model('Cab', cabSchema);