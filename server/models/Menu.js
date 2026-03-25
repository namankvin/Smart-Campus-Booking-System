const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  vendor: { type: String, required: true },
  date: { type: Date, required: true },
  items: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
    isAvailable: { type: Boolean, default: true }
  }]
});

module.exports = mongoose.model('Menu', menuSchema);