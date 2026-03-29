require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Cab = require('../models/Cab');
const Menu = require('../models/Menu');
const { classrooms, cabs, users, menus } = require('./seedData');

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to run seed script');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

const seedDatabase = async () => {
  await User.deleteMany({
    $or: [
      { email: { $in: users.map((user) => user.email) } },
      { googleId: { $in: users.map((user) => user.googleId) } }
    ]
  });
  await Classroom.deleteMany({ name: { $in: classrooms.map((room) => room.name) } });
  await Cab.deleteMany({ id: { $in: cabs.map((cab) => cab.id) } });
  await Menu.deleteMany({
    vendor: { $in: menus.map((menu) => menu.vendor) },
    date: { $in: menus.map((menu) => menu.date) }
  });

  await User.insertMany(users);
  await Classroom.insertMany(classrooms);
  await Cab.insertMany(cabs);
  await Menu.insertMany(menus);

  return {
    users: users.length,
    classrooms: classrooms.length,
    cabs: cabs.length,
    menus: menus.length
  };
};

const runSeed = async () => {
  try {
    await connect();
    const summary = await seedDatabase();
    console.log('Seed completed successfully:', summary);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedDatabase };
