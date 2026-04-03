const Cab = require('../models/Cab');
const Booking = require('../models/Booking');

const DEV_OPERATOR_ROUTE = {
  routeName: 'North Campus Loop',
  routeStops: ['Main Gate', 'Academic Block', 'Library', 'Hostel Circle', 'Sports Complex']
};

const ensureDevelopmentCabForOperator = async (operatorUser) => {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const normalizedName = String(operatorUser?.name || 'Operator').trim();
  const compactName = normalizedName.replace(/\s+/g, ' ').slice(0, 18);
  const operatorIdSeed = String(operatorUser?.id || operatorUser?._id || '').trim();
  const cabSuffix = operatorIdSeed ? operatorIdSeed.slice(-5).toUpperCase() : '001';
  const cabId = `DEV-CAB-${cabSuffix}`;

  let cab = await Cab.findOne({ id: cabId });
  if (!cab) {
    cab = await Cab.create({
      id: cabId,
      assignedOperator: operatorUser.id,
      driver: compactName,
      capacity: 4,
      isAvailable: true,
      currentLocation: DEV_OPERATOR_ROUTE.routeStops[0],
      routeName: DEV_OPERATOR_ROUTE.routeName,
      routeStops: DEV_OPERATOR_ROUTE.routeStops
    });
    return cab;
  }

  cab.assignedOperator = operatorUser.id;
  cab.routeName = DEV_OPERATOR_ROUTE.routeName;
  cab.routeStops = DEV_OPERATOR_ROUTE.routeStops;
  await cab.save();
  return cab;
};

const getAvailableCabs = async (req, res) => {
  try {
    const cabs = await Cab.find({ isAvailable: true });
    res.json(cabs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCab = async (req, res) => {
  try {
    const {
      id,
      driver,
      capacity,
      assignedOperator = null,
      routeName = '',
      routeStops = []
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Cab ID is required' });
    }

    const cab = new Cab({
      id,
      driver,
      capacity,
      assignedOperator,
      routeName,
      routeStops,
      isAvailable: true
    });
    await cab.save();
    res.status(201).json(cab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOperatorCabStats = async (req, res) => {
  try {
    let cab = await Cab.findOne({ assignedOperator: req.user.id });

    if (!cab) {
      cab = await ensureDevelopmentCabForOperator(req.user);
    }

    if (!cab) {
      return res.json({
        cab: null,
        stats: {
          totalAssignedRides: 0,
          upcomingRides: 0,
          completedRides: 0
        }
      });
    }

    const [totalAssignedRides, upcomingRides, completedRides] = await Promise.all([
      Booking.countDocuments({ type: 'cab', cabId: cab.id }),
      Booking.countDocuments({
        type: 'cab',
        cabId: cab.id,
        status: 'Confirmed',
        date: { $gte: new Date() }
      }),
      Booking.countDocuments({
        type: 'cab',
        cabId: cab.id,
        status: 'Completed'
      })
    ]);

    return res.json({
      cab,
      stats: {
        totalAssignedRides,
        upcomingRides,
        completedRides
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateCabStatus = async (req, res, io) => {
  try {
    const { id } = req.params;
    const { isAvailable, currentLocation } = req.body;
    
    const cab = await Cab.findByIdAndUpdate(
      id,
      { isAvailable, currentLocation },
      { new: true }
    );
    
    io.emit('cab_status_updated', { cab });
    res.json(cab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAvailableCabs, createCab, updateCabStatus, getOperatorCabStats };