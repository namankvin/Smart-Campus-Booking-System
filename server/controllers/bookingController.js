const Booking = require('../models/Booking');
const User = require('../models/User');
const Log = require('../models/Log');

// Create classroom booking
const createClassroomBooking = async (req, res, io) => {
  try {
    const { classroom, date, startTime, endTime, purpose } = req.body;
    
    // Check for conflicts
    const conflict = await Booking.findOne({
      classroom,
      date,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ],
      status: 'Approved'
    });
    
    if (conflict) {
      return res.status(409).json({ error: 'Time slot already booked' });
    }
    
    const booking = new Booking({
      user: req.user.id,
      type: 'classroom',
      classroom,
      date,
      startTime,
      endTime,
      purpose,
      status: 'Pending'
    });
    
    await booking.save();
    
    // Log the action
    await Log.create({
      action: 'classroom_booking_created',
      user: req.user.id,
      details: { bookingId: booking._id }
    });
    
    // Emit real-time notification
    io.emit('new_pending_booking', { booking });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user bookings
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('classroom')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res, io) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Check cutoff times based on booking type
    const now = new Date();
    const bookingTime = new Date(booking.date);
    
    if (booking.type === 'classroom') {
      // Any time cancellation allowed for classrooms
      booking.status = 'Cancelled';
    } else if (booking.type === 'food') {
      // 15 minutes before pickup
      const fifteenMinBefore = new Date(booking.pickupTime.getTime() - 15 * 60000);
      if (now > fifteenMinBefore) {
        return res.status(400).json({ error: 'Cannot cancel after 15 minutes before pickup' });
      }
      booking.status = 'Cancelled';
    } else if (booking.type === 'cab') {
      // 15 minutes before booking time
      const fifteenMinBefore = new Date(bookingTime.getTime() - 15 * 60000);
      if (now > fifteenMinBefore) {
        return res.status(400).json({ error: 'Cannot cancel after 15 minutes before booking time' });
      }
      booking.status = 'Cancelled';
    }
    
    await booking.save();
    
    // Log cancellation
    await Log.create({
      action: 'booking_cancelled',
      user: req.user.id,
      details: { bookingId: id }
    });
    
    io.emit('booking_cancelled', { bookingId: id });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Place food order
const placeFoodOrder = async (req, res, io) => {
  try {
    const { vendor, items, pickupTime } = req.body;
    
    // Check cutoff (orders should be placed before vendor cutoff)
    const now = new Date();
    const pickupDate = new Date(pickupTime);
    
    if (now > pickupDate) {
      return res.status(400).json({ error: 'Cannot order for past time' });
    }
    
    const totalCost = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const booking = new Booking({
      user: req.user.id,
      type: 'food',
      vendor,
      items,
      pickupTime,
      totalCost,
      status: 'Accepted'
    });
    
    await booking.save();
    
    await Log.create({
      action: 'food_order_placed',
      user: req.user.id,
      details: { bookingId: booking._id }
    });
    
    io.emit('new_food_order', { booking });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Book cab
const bookCab = async (req, res, io) => {
  try {
    const { pickupLocation, dropLocation } = req.body;
    
    // Check 6-hour advance booking
    const now = new Date();
    const maxBookingTime = new Date(now.getTime() + 6 * 60 * 60000);
    const requestedTime = new Date(req.body.requestedTime);
    
    if (requestedTime > maxBookingTime) {
      return res.status(400).json({ error: 'Can only book cabs up to 6 hours in advance' });
    }
    
    const booking = new Booking({
      user: req.user.id,
      type: 'cab',
      pickupLocation,
      dropLocation,
      date: requestedTime,
      status: 'Confirmed'
    });
    
    await booking.save();
    
    await Log.create({
      action: 'cab_booked',
      user: req.user.id,
      details: { bookingId: booking._id }
    });
    
    io.emit('new_cab_booking', { booking });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createClassroomBooking,
  getUserBookings,
  cancelBooking,
  placeFoodOrder,
  bookCab
};