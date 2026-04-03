const Booking = require('../models/Booking');
const Menu = require('../models/Menu');
const Cab = require('../models/Cab');
const Log = require('../models/Log');
const User = require('../models/User');
const { createNotification, notifyRoles, notifyUsers } = require('../utils/notifications');

const ACTIVE_FOOD_STATUSES = ['Accepted', 'Preparing', 'Ready'];

const normalizeDate = (dateInput) => {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
};

const combineDateAndTime = (dateInput, timeInput) => {
  const date = new Date(dateInput);
  const [hours, minutes] = (timeInput || '').split(':').map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
};

const buildRecurringDates = (baseDateInput, recurrenceType, recurrenceCount) => {
  const baseDate = normalizeDate(baseDateInput);
  const dates = [];
  for (let i = 0; i < recurrenceCount; i += 1) {
    const nextDate = new Date(baseDate);
    if (recurrenceType === 'weekly') {
      nextDate.setDate(baseDate.getDate() + 7 * i);
    } else if (recurrenceType === 'monthly') {
      nextDate.setMonth(baseDate.getMonth() + i);
    }
    dates.push(nextDate);
  }
  return dates;
};

// Create classroom booking
const createClassroomBooking = async (req, res, io) => {
  try {
    const {
      classroom,
      date,
      startTime,
      endTime,
      purpose,
      joinWaitlist = false,
      recurrenceType = 'none',
      recurrenceCount = 1
    } = req.body;

    if (!classroom || !date || !startTime || !endTime || !purpose) {
      return res.status(400).json({ error: 'Classroom, date, time, and purpose are required' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const firstBookingStart = combineDateAndTime(date, startTime);
    if (Number.isNaN(firstBookingStart.getTime()) || firstBookingStart <= new Date()) {
      return res.status(400).json({ error: 'Booking date/time must be in the future' });
    }

    const isFaculty = req.user.role === 'Faculty';
    if (recurrenceType !== 'none' && !isFaculty) {
      return res.status(403).json({ error: 'Recurring bookings are only allowed for Faculty' });
    }

    if (!['none', 'weekly', 'monthly'].includes(recurrenceType)) {
      return res.status(400).json({ error: 'Invalid recurrence type' });
    }

    const parsedCount = Number(recurrenceCount || 1);
    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 16) {
      return res.status(400).json({ error: 'Recurrence count must be between 1 and 16' });
    }

    const bookingDates = recurrenceType === 'none'
      ? [normalizeDate(date)]
      : buildRecurringDates(date, recurrenceType, parsedCount);

    const approvedConflicts = [];
    for (const bookingDate of bookingDates) {
      const conflict = await Booking.findOne({
        classroom,
        date: bookingDate,
        type: 'classroom',
        status: 'Approved',
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      });
      if (conflict) {
        approvedConflicts.push(bookingDate.toISOString().split('T')[0]);
      }
    }

    if (approvedConflicts.length > 0) {
      return res.status(409).json({
        error: 'Approved booking conflict exists for one or more selected dates',
        conflicts: approvedConflicts
      });
    }

    const recurringGroupId = bookingDates.length > 1 ? `rec-${Date.now()}-${req.user.id}` : null;
    const bookingsToCreate = [];

    for (const bookingDate of bookingDates) {
      const hasPendingOverlap = await Booking.findOne({
        classroom,
        date: bookingDate,
        type: 'classroom',
        status: 'Pending',
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      });

      if (hasPendingOverlap && !joinWaitlist) {
        return res.status(409).json({
          code: 'PENDING_EXISTS',
          error: 'A pending request already exists for this slot. Join waitlist or choose another slot.',
          date: bookingDate.toISOString().split('T')[0]
        });
      }

      let waitlistPosition = null;
      let status = 'Pending';
      if (hasPendingOverlap && joinWaitlist) {
        const waitlistedCount = await Booking.countDocuments({
          classroom,
          date: bookingDate,
          type: 'classroom',
          status: 'Waitlisted',
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        });
        waitlistPosition = waitlistedCount + 1;
        status = 'Waitlisted';
      }

      bookingsToCreate.push({
        user: req.user.id,
        type: 'classroom',
        classroom,
        date: bookingDate,
        startTime,
        endTime,
        purpose,
        status,
        waitlistPosition,
        isRecurring: bookingDates.length > 1,
        recurringGroupId
      });
    }

    const createdBookings = await Booking.insertMany(bookingsToCreate);

    await Log.create({
      action: 'classroom_booking_created',
      user: req.user.id,
      details: { bookingIds: createdBookings.map((b) => b._id), recurringGroupId }
    });

    await createNotification({
      recipient: req.user.id,
      title: 'Classroom request submitted',
      message: createdBookings.some((b) => b.status === 'Waitlisted')
        ? 'Your booking request has been waitlisted for review.'
        : 'Your classroom booking request is pending admin approval.',
      type: 'info',
      metadata: { bookingIds: createdBookings.map((b) => b._id) },
      io
    });

    await notifyRoles({
      roles: ['Admin'],
      title: 'New classroom booking request',
      message: `${req.user.email} submitted a classroom request.`,
      type: 'info',
      metadata: { bookingIds: createdBookings.map((b) => b._id) },
      io
    });

    io.emit('new_pending_booking', { bookings: createdBookings });

    res.json({
      bookings: createdBookings,
      recurring: bookingDates.length > 1,
      waitlisted: createdBookings.some((b) => b.status === 'Waitlisted')
    });
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

    if (['Cancelled', 'Rejected'].includes(booking.status)) {
      return res.status(400).json({ error: 'Booking is already inactive' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ error: 'Completed bookings cannot be cancelled' });
    }

    const now = new Date();
    const bookingTime = new Date(booking.date);

    const previousStatus = booking.status;

    if (booking.type === 'classroom') {
      booking.status = 'Cancelled';
    } else if (booking.type === 'food') {
      if (['Preparing', 'Ready'].includes(booking.status)) {
        return res.status(400).json({ error: 'Cannot cancel once preparation has started' });
      }

      if (!booking.pickupTime) {
        return res.status(400).json({ error: 'Booking has no pickup time' });
      }

      const fifteenMinBefore = new Date(booking.pickupTime.getTime() - 15 * 60000);
      if (now > fifteenMinBefore) {
        return res.status(400).json({ error: 'Cannot cancel after 15 minutes before pickup' });
      }
      booking.status = 'Cancelled';
    } else if (booking.type === 'cab') {
      if (booking.status !== 'Confirmed') {
        return res.status(400).json({ error: 'Only confirmed cab bookings can be cancelled' });
      }

      const fifteenMinBefore = new Date(bookingTime.getTime() - 15 * 60000);
      if (now > fifteenMinBefore) {
        return res.status(400).json({ error: 'Cannot cancel after 15 minutes before booking time' });
      }
      booking.status = 'Cancelled';

      if (booking.cabId) {
        await Cab.findOneAndUpdate({ id: booking.cabId }, { isAvailable: true });
      }
    }

    await booking.save();

    if (booking.type === 'classroom' && ['Pending', 'Approved'].includes(previousStatus)) {
      const nextWaitlisted = await Booking.findOne({
        classroom: booking.classroom,
        date: booking.date,
        type: 'classroom',
        status: 'Waitlisted',
        startTime: { $lt: booking.endTime },
        endTime: { $gt: booking.startTime }
      }).sort({ waitlistPosition: 1, createdAt: 1 });

      if (nextWaitlisted) {
        nextWaitlisted.status = 'Pending';
        nextWaitlisted.waitlistPosition = null;
        await nextWaitlisted.save();
        io.emit('waitlist_promoted', { booking: nextWaitlisted });

        await createNotification({
          recipient: nextWaitlisted.user,
          title: 'Waitlist updated',
          message: 'Your waitlisted classroom request moved to pending approval.',
          type: 'success',
          metadata: { bookingId: nextWaitlisted._id },
          io
        });
      }
    }
    
    // Log cancellation
    await Log.create({
      action: 'booking_cancelled',
      user: req.user.id,
      details: { bookingId: id }
    });

    await createNotification({
      recipient: req.user.id,
      title: 'Booking cancelled',
      message: `Your ${booking.type} booking has been cancelled.`,
      type: 'warning',
      metadata: { bookingId: id, type: booking.type },
      io
    });

    if (booking.type === 'classroom') {
      await notifyRoles({
        roles: ['Admin'],
        title: 'Classroom booking cancelled',
        message: `${req.user.email} cancelled a classroom request/booking.`,
        type: 'warning',
        metadata: { bookingId: id },
        io
      });
    }
    
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

    if (!vendor || !Array.isArray(items) || items.length === 0 || !pickupTime) {
      return res.status(400).json({ error: 'Vendor, items, and pickup time are required' });
    }

    const now = new Date();
    const pickupDate = new Date(pickupTime);

    if (Number.isNaN(pickupDate.getTime()) || now > pickupDate) {
      return res.status(400).json({ error: 'Cannot order for past time' });
    }

    const menu = await Menu.findOne({
      vendor,
      date: normalizeDate(pickupDate)
    });

    if (!menu) {
      return res.status(404).json({ error: 'Menu not available for selected vendor/date' });
    }

    const normalizedItems = [];
    for (const item of items) {
      if (!item.name || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ error: 'Each item must include a valid name and quantity' });
      }

      const menuItem = menu.items.find((menuEntry) => menuEntry.name === item.name);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ error: `${item.name} is unavailable` });
      }

      normalizedItems.push({
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    const slotCapacity = Number(process.env.FOOD_SLOT_CAPACITY || 50);
    const slotStart = new Date(pickupDate);
    slotStart.setMinutes(0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotStart.getHours() + 1);

    const slotOrders = await Booking.countDocuments({
      type: 'food',
      vendor,
      pickupTime: { $gte: slotStart, $lt: slotEnd },
      status: { $in: ACTIVE_FOOD_STATUSES }
    });

    if (slotOrders >= slotCapacity) {
      return res.status(400).json({ error: 'Selected pickup slot is full. Please choose another time.' });
    }

    const totalCost = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const booking = new Booking({
      user: req.user.id,
      type: 'food',
      vendor,
      items: normalizedItems,
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

    await createNotification({
      recipient: req.user.id,
      title: 'Food order accepted',
      message: `Your order with ${vendor} was accepted.`,
      type: 'success',
      metadata: { bookingId: booking._id, vendor },
      io
    });

    const mappedVendors = await User.find({
      role: 'Vendor',
      assignedRestaurant: vendor
    }, '_id');

    await notifyUsers({
      recipients: mappedVendors.map((vendorUser) => vendorUser._id),
      title: 'New food order',
      message: `A new order was placed for ${vendor}.`,
      type: 'info',
      metadata: { bookingId: booking._id, vendor },
      io
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
    const { pickupLocation, dropLocation, requestedTime } = req.body;

    if (!pickupLocation || !dropLocation || !requestedTime) {
      return res.status(400).json({ error: 'Pickup location, drop location, and requested time are required' });
    }

    const now = new Date();
    const maxBookingTime = new Date(now.getTime() + 6 * 60 * 60000);
    const parsedRequestedTime = new Date(requestedTime);

    if (Number.isNaN(parsedRequestedTime.getTime()) || parsedRequestedTime <= now) {
      return res.status(400).json({ error: 'Requested time must be in the future' });
    }

    if (parsedRequestedTime > maxBookingTime) {
      return res.status(400).json({ error: 'Can only book cabs up to 6 hours in advance' });
    }

    const allowedLocations = (process.env.CAMPUS_LOCATIONS || '')
      .split(',')
      .map((location) => location.trim())
      .filter(Boolean);

    if (allowedLocations.length > 0) {
      if (!allowedLocations.includes(pickupLocation) || !allowedLocations.includes(dropLocation)) {
        return res.status(400).json({ error: 'Pickup/drop location must be within campus-approved locations' });
      }
    }

    const existingActiveCabBooking = await Booking.findOne({
      user: req.user.id,
      type: 'cab',
      status: 'Confirmed',
      date: { $gte: now }
    });

    if (existingActiveCabBooking) {
      return res.status(400).json({ error: 'You already have an active cab booking' });
    }

    const availableCab = await Cab.findOne({
      isAvailable: true,
      assignedOperator: { $ne: null }
    }) || await Cab.findOne({ isAvailable: true });
    if (!availableCab) {
      return res.status(409).json({ error: 'No cabs available for selected time' });
    }

    const booking = new Booking({
      user: req.user.id,
      type: 'cab',
      pickupLocation,
      dropLocation,
      date: parsedRequestedTime,
      cabId: availableCab.id,
      status: 'Confirmed'
    });

    await booking.save();

    availableCab.isAvailable = false;
    availableCab.currentLocation = pickupLocation;
    await availableCab.save();
    
    await Log.create({
      action: 'cab_booked',
      user: req.user.id,
      details: { bookingId: booking._id }
    });

    await createNotification({
      recipient: req.user.id,
      title: 'Cab booking confirmed',
      message: `Cab ${availableCab.id} has been assigned to your ride.`,
      type: 'success',
      metadata: { bookingId: booking._id, cabId: availableCab.id },
      io
    });

    if (availableCab.assignedOperator) {
      await notifyUsers({
        recipients: [availableCab.assignedOperator],
        title: 'New cab assignment',
        message: `Cab ${availableCab.id} has a new booking.`,
        type: 'info',
        metadata: { bookingId: booking._id, cabId: availableCab.id },
        io
      });
    } else {
      await notifyRoles({
        roles: ['Cab Operator'],
        title: 'New cab assignment',
        message: `Cab ${availableCab.id} has a new booking.`,
        type: 'info',
        metadata: { bookingId: booking._id, cabId: availableCab.id },
        io
      });
    }
    
    io.emit('new_cab_booking', { booking, cab: availableCab });

    res.json({ booking, cab: availableCab });
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