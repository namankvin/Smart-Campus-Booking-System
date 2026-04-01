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

const issueToken = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
);

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

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
    const requestRole = String(req.body.role || '').trim() || null;
    const allowedRoles = ['Student', 'Faculty', 'Vendor', 'Cab Operator', 'Admin'];

    if (requestRole && !allowedRoles.includes(requestRole)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    const institutionalDomain = process.env.INSTITUTIONAL_EMAIL_DOMAIN;
    let user = await User.findOne({ googleId });

    // Determine role: priority request -> existing user -> inferred from email
    let targetRole = requestRole || (user ? user.role : null);
    if (!targetRole) {
      if (institutionalDomain && email.endsWith(`@${institutionalDomain}`)) {
        targetRole = 'Student';
      } else {
        targetRole = 'Student';
      }
    }

    // If role is Student, enforce institutional email
    if (targetRole === 'Student' && institutionalDomain && !email.endsWith(`@${institutionalDomain}`)) {
      await logAuthAttempt({
        action: 'auth_login_failed',
        details: { reason: 'non_institutional_email', email, role: targetRole }
      });
      return res.status(403).json({
        error: `Students must use institutional email accounts (@${institutionalDomain})`
      });
    }

    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        profilePicture,
        role: targetRole
      });
      await user.save();
    } else {
      // Update role only if provided explicitly and different
      if (requestRole && user.role !== requestRole) {
        user.role = requestRole;
      }

      const nextProfile = {
        email,
        name,
        profilePicture: profilePicture || user.profilePicture
      };
      if (user.email !== nextProfile.email || user.name !== nextProfile.name || user.profilePicture !== nextProfile.profilePicture) {
        user.email = nextProfile.email;
        user.name = nextProfile.name;
        user.profilePicture = nextProfile.profilePicture;
      }
      await user.save();
    }
    
    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        profilePicture,
        role: 'Student'
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
    
    const token = issueToken(user);

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

const devLogin = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Development login is disabled in production' });
    }

    const { email = 'dev.user@test.edu', name = 'Dev User', role = 'Student' } = req.body || {};
    const allowedRoles = ['Student', 'Faculty', 'Vendor', 'Cab Operator', 'Admin'];
    const normalizedRole = allowedRoles.includes(role) ? role : 'Student';
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required for development login' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const safeIdPart = normalizedEmail.replace(/[^a-z0-9]/g, '-');
      user = await User.create({
        googleId: `dev-${safeIdPart}`,
        email: normalizedEmail,
        name,
        role: normalizedRole
      });
    } else {
      if (user.role !== normalizedRole || user.name !== name) {
        user.role = normalizedRole;
        user.name = name;
        await user.save();
      }
    }

    const token = issueToken(user);

    await logAuthAttempt({
      action: 'auth_login_success',
      user: user._id,
      details: { email: user.email, role: user.role, method: 'dev_login' }
    });

    return res.json({ token, user });
  } catch (error) {
    console.error('Dev login error:', error);
    return res.status(500).json({ error: error.message });
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

module.exports = { googleLogin, devLogin, getProfile, logout };