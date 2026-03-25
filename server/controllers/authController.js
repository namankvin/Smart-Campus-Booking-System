const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Google OAuth callback (simulated)
const googleLogin = async (req, res) => {
  try {
    const { googleId, email, name, profilePicture } = req.body;
    
    let user = await User.findOne({ googleId });
    
    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        profilePicture,
        role: 'Student' // Default role
      });
      await user.save();
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

module.exports = { googleLogin, getProfile, logout };