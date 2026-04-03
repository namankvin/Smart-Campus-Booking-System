const Booking = require('../models/Booking');
const User = require('../models/User');
const Log = require('../models/Log');
const Classroom = require('../models/Classroom');
const Cab = require('../models/Cab');
const { createNotification } = require('../utils/notifications');

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
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.type !== 'classroom') {
      return res.status(400).json({ error: 'Only classroom bookings require approval' });
    }

    const conflict = await Booking.findOne({
      _id: { $ne: id },
      type: 'classroom',
      classroom: booking.classroom,
      date: booking.date,
      status: 'Approved',
      startTime: { $lt: booking.endTime },
      endTime: { $gt: booking.startTime }
    });

    if (conflict) {
      return res.status(409).json({ error: 'An approved booking already exists for this slot' });
    }

    booking.status = 'Approved';
    await booking.save();
    
    await Log.create({
      action: 'booking_approved',
      user: req.user.id,
      details: { bookingId: id }
    });
    
    await Booking.updateMany({
      _id: { $ne: id },
      type: 'classroom',
      classroom: booking.classroom,
      date: booking.date,
      status: 'Pending',
      startTime: { $lt: booking.endTime },
      endTime: { $gt: booking.startTime }
    }, { status: 'Rejected' });

    await createNotification({
      recipient: booking.user,
      title: 'Classroom booking approved',
      message: 'Your classroom booking request was approved by admin.',
      type: 'success',
      metadata: { bookingId: booking._id },
      io
    });
    
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
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'Rejected';
    await booking.save();
    
    await Log.create({
      action: 'booking_rejected',
      user: req.user.id,
      details: { bookingId: id }
    });

    await createNotification({
      recipient: booking.user,
      title: 'Classroom booking rejected',
      message: 'Your classroom booking request was rejected by admin.',
      type: 'error',
      metadata: { bookingId: booking._id },
      io
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
    if (!booking) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ error: 'Completed orders cannot be modified' });
    }

    if (!validTransitions[booking.status] || !validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    
    booking.status = status;
    await booking.save();

    await Log.create({
      action: 'order_status_updated',
      user: req.user.id,
      details: { bookingId: id, status }
    });

    await createNotification({
      recipient: booking.user,
      title: 'Food order status updated',
      message: `Your order is now ${status}.`,
      type: 'info',
      metadata: { bookingId: booking._id, status },
      io
    });
    
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

const getFleetCabs = async (req, res) => {
  try {
    const cabs = await Cab.find().populate('assignedOperator', 'name email role').sort({ id: 1 });
    res.json(cabs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-googleId').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ['Student', 'Faculty', 'Vendor', 'Cab Operator', 'Admin', 'Guest'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Log.create({
      action: 'user_role_updated',
      user: req.user.id,
      details: { targetUserId: id, role }
    });

    await createNotification({
      recipient: user._id,
      title: 'Role updated',
      message: `Your account role was updated to ${role}.`,
      type: 'info',
      metadata: { role },
      io: req.io
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const vendor = currentUser?.assignedRestaurant;

    if (!vendor) {
      return res.status(403).json({ error: 'Vendor account is not mapped to a restaurant' });
    }

    const orders = await Booking.find({
      type: 'food',
      vendor,
      status: { $in: ['Accepted', 'Preparing', 'Ready'] }
    }).populate('user').sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateVendorRestaurantMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantName } = req.body;

    const normalizedRestaurant = String(restaurantName || '').trim();
    if (!normalizedRestaurant) {
      return res.status(400).json({ error: 'Restaurant name is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = 'Vendor';
    user.assignedRestaurant = normalizedRestaurant;
    await user.save();

    await Log.create({
      action: 'vendor_restaurant_mapped',
      user: req.user.id,
      details: { targetUserId: user._id, restaurantName: normalizedRestaurant }
    });

    await createNotification({
      recipient: user._id,
      title: 'Vendor mapping updated',
      message: `Your vendor account is now mapped to ${normalizedRestaurant}.`,
      type: 'info',
      metadata: { restaurantName: normalizedRestaurant },
      io: req.io
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCabOperatorMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const { cabId } = req.body;

    const normalizedCabId = String(cabId || '').trim();
    if (!normalizedCabId) {
      return res.status(400).json({ error: 'Cab ID is required' });
    }

    const [user, cab] = await Promise.all([
      User.findById(id),
      Cab.findOne({ id: normalizedCabId })
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!cab) {
      return res.status(404).json({ error: 'Cab not found' });
    }

    await Cab.updateMany({ assignedOperator: user._id, _id: { $ne: cab._id } }, { assignedOperator: null });
    cab.assignedOperator = user._id;
    await cab.save();

    user.role = 'Cab Operator';
    await user.save();

    await Log.create({
      action: 'cab_operator_mapped',
      user: req.user.id,
      details: { targetUserId: user._id, cabId: normalizedCabId }
    });

    await createNotification({
      recipient: user._id,
      title: 'Cab assignment updated',
      message: `You are now assigned to cab ${normalizedCabId}.`,
      type: 'info',
      metadata: { cabId: normalizedCabId },
      io: req.io
    });

    res.json({ user, cab });
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
  getClassroomsByAdmin,
  getFleetCabs,
  getUsers,
  updateUserRole,
  getVendorOrders,
  updateVendorRestaurantMapping,
  updateCabOperatorMapping
};