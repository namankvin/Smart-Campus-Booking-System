const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['classroom', 'food', 'cab'], required: true },
  // For classroom
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  date: { type: Date },
  startTime: { type: String },
  endTime: { type: String },
  purpose: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'], default: 'Pending' },
  // For food
  vendor: { type: String },
  items: [{
    name: String,
    quantity: Number,
    price: Number
  }],
  totalCost: { type: Number },
  pickupTime: { type: Date },
  // For cab
  pickupLocation: { type: String },
  dropLocation: { type: String },
  cabId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);