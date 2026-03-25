const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createUserAndToken = async ({
  email = 'student@test.edu',
  role = 'Student',
  name = 'Test User',
  googleId = `gid-${Date.now()}`
} = {}) => {
  const user = await User.create({ email, role, name, googleId });
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
  return { user, token };
};

module.exports = { createUserAndToken };
