const Classroom = require('../models/Classroom');

const defaultClassrooms = [
  {
    name: 'LHC-101',
    capacity: 120,
    location: 'Lecture Hall Complex - Block A',
    amenities: ['Projector', 'Smart Board', 'Air Conditioning'],
    isActive: true
  },
  {
    name: 'CSE-205',
    capacity: 75,
    location: 'CSE Department - 2nd Floor',
    amenities: ['Projector', 'Whiteboard'],
    isActive: true
  },
  {
    name: 'ME-310',
    capacity: 60,
    location: 'Mechanical Block - 3rd Floor',
    amenities: ['Smart Display', 'Mic System'],
    isActive: true
  }
];

const getAllClassrooms = async (req, res) => {
  try {
    let classrooms = await Classroom.find({ isActive: true });

    if (classrooms.length === 0) {
      await Classroom.insertMany(defaultClassrooms);
      classrooms = await Classroom.find({ isActive: true });
    }

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