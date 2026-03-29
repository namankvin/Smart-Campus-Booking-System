require('dotenv').config();
const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Log = require('../models/Log');
const Menu = require('../models/Menu');
const Cab = require('../models/Cab');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const { seedDatabase } = require('./seed');

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to run reset script');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

const resetDatabase = async ({ withSeed = false } = {}) => {
  await Promise.all([
    Booking.deleteMany({}),
    Notification.deleteMany({}),
    Log.deleteMany({}),
    Menu.deleteMany({}),
    Cab.deleteMany({}),
    Classroom.deleteMany({}),
    User.deleteMany({})
  ]);

  if (withSeed) {
    return seedDatabase();
  }

  return null;
};

const runReset = async () => {
  const withSeed = process.argv.includes('--with-seed');

  try {
    await connect();
    const summary = await resetDatabase({ withSeed });

    if (withSeed) {
      console.log('Reset completed and seed data restored:', summary);
    } else {
      console.log('Reset completed. Database collections cleared.');
    }
  } catch (error) {
    console.error('Reset failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  runReset();
}

module.exports = { resetDatabase };
