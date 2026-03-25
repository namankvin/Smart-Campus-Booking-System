const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Google OAuth callback (simulated)
const googleLogin = async (req, res) => {
  try {
    const { googleId, email, name, profilePicture, role: requestedRole } = req.body;

    const allowedRoles = ['Student', 'Faculty', 'Vendor', 'Cab Operator', 'Admin'];
    const institutionalDomain = process.env.INSTITUTIONAL_EMAIL_DOMAIN;

    if (institutionalDomain && !email.endsWith(`@${institutionalDomain}`)) {
      return res.status(403).json({
        error: `Only institutional email accounts (@${institutionalDomain}) are allowed`
      });
    }
    
    let user = await User.findOne({ googleId });
    
    if (!user) {
      const normalizedRole = allowedRoles.includes(requestedRole) ? requestedRole : 'Student';
      user = new User({
        googleId,
        email,
        name,
        profilePicture,
        role: normalizedRole
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