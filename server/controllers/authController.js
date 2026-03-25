const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Log = require('../models/Log');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const logAuthAttempt = async ({ action, user, details }) => {
  try {
    await Log.create({ action, user, details });
  } catch (error) {
    // Ignore logging failures to avoid blocking auth flows.
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential, role: requestedRole } = req.body;

    if (!credential) {
      await logAuthAttempt({
        action: 'auth_login_failed',
        details: { reason: 'missing_credential' }
      });
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured on server' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      await logAuthAttempt({
        action: 'auth_login_failed',
        details: { reason: 'invalid_google_payload' }
      });
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email;
    const profilePicture = payload.picture;

    const allowedRoles = ['Student', 'Faculty', 'Vendor', 'Cab Operator', 'Admin'];
    const institutionalDomain = process.env.INSTITUTIONAL_EMAIL_DOMAIN;

    if (institutionalDomain && !email.endsWith(`@${institutionalDomain}`)) {
      await logAuthAttempt({
        action: 'auth_login_failed',
        details: { reason: 'non_institutional_email', email }
      });
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
    } else {
      const nextProfile = {
        email,
        name,
        profilePicture: profilePicture || user.profilePicture
      };
      if (user.email !== nextProfile.email || user.name !== nextProfile.name || user.profilePicture !== nextProfile.profilePicture) {
        user.email = nextProfile.email;
        user.name = nextProfile.name;
        user.profilePicture = nextProfile.profilePicture;
        await user.save();
      }
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    await logAuthAttempt({
      action: 'auth_login_success',
      user: user._id,
      details: { email: user.email, role: user.role }
    });
    
    res.json({ token, user });
  } catch (error) {
    await logAuthAttempt({
      action: 'auth_login_failed',
      details: { reason: 'verification_error', message: error.message }
    });
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
  logAuthAttempt({
    action: 'auth_logout',
    user: req.user.id,
    details: { email: req.user.email }
  });
  res.json({ message: 'Logged out successfully' });
};

module.exports = { googleLogin, getProfile, logout };