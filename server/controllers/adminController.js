const Booking = require('../models/Booking');
const User = require('../models/User');
const Log = require('../models/Log');

// Get all pending classroom bookings
const getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      type: 'classroom',
      status: 'Pending'
    }).populate('user').sort({ createdAt: 1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve booking
const approveBooking = async (req, res, io) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'Approved' },
      { new: true }
    );
    
    await Log.create({
      action: 'booking_approved',
      user: req.user.id,
      details: { bookingId: id }
    });
    
    // Reject conflicting pending bookings
    if (booking.type === 'classroom') {
      await Booking.updateMany({
        _id: { $ne: id },
        classroom: booking.classroom,
        date: booking.date,
        status: 'Pending'
      }, { status: 'Rejected' });
    }
    
    io.emit('booking_approved', { booking });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject booking
const rejectBooking = async (req, res, io) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'Rejected' },
      { new: true }
    );
    
    await Log.create({
      action: 'booking_rejected',
      user: req.user.id,
      details: { bookingId: id }
    });
    
    io.emit('booking_rejected', { booking });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update order status (vendor)
const updateOrderStatus = async (req, res, io) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status transitions
    const validTransitions = {
      'Accepted': ['Preparing'],
      'Preparing': ['Ready'],
      'Ready': ['Completed']
    };
    
    const booking = await Booking.findById(id);
    if (!validTransitions[booking.status] || !validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    
    booking.status = status;
    await booking.save();
    
    io.emit('order_status_updated', { booking });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate usage reports
const generateReports = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    const query = {
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };
    
    if (type) query.type = type;
    
    const bookings = await Booking.find(query);
    
    const report = {
      totalBookings: bookings.length,
      byStatus: {},
      byType: {},
      revenue: 0
    };
    
    bookings.forEach(booking => {
      report.byStatus[booking.status] = (report.byStatus[booking.status] || 0) + 1;
      report.byType[booking.type] = (report.byType[booking.type] || 0) + 1;
      if (booking.totalCost) report.revenue += booking.totalCost;
    });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Manage classroom bookings (CRUD)
const getClassroomsByAdmin = async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPendingBookings,
  approveBooking,
  rejectBooking,
  updateOrderStatus,
  generateReports,
  getClassroomsByAdmin
};