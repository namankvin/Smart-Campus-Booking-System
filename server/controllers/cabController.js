const Cab = require('../models/Cab');

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
    const { id, driver, capacity } = req.body;
    const cab = new Cab({ id, driver, capacity, isAvailable: true });
    await cab.save();
    res.status(201).json(cab);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

module.exports = { getAvailableCabs, createCab, updateCabStatus };