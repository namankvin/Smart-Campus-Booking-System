const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  location: { type: String, required: true },
  amenities: [String],
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Classroom', classroomSchema);