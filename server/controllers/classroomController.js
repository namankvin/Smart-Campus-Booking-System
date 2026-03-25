const Classroom = require('../models/Classroom');

const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ isActive: true });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createClassroom = async (req, res) => {
  try {
    const { name, capacity, location, amenities } = req.body;
    const classroom = new Classroom({ name, capacity, location, amenities });
    await classroom.save();
    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const classroom = await Classroom.findByIdAndUpdate(id, req.body, { new: true });
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllClassrooms, createClassroom, updateClassroom };