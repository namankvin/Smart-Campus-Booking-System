const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Log = require('../models/Log');
const Cab = require('../models/Cab');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ADMIN_ALLOWED_EMAILS = ['namank1506@gmail.com'];

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

const isInstitutionalEmail = (email, configuredDomain) => {
  if (!email) return false;
  const normalizedEmail = String(email).trim().toLowerCase();

  if (configuredDomain) {
    return normalizedEmail.endsWith(`@${String(configuredDomain).toLowerCase()}`);
  }

  return /@([a-z0-9-]+\.)+nitw\.ac\.in$/i.test(normalizedEmail);
};

const isAdminEmailAllowed = (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return ADMIN_ALLOWED_EMAILS.includes(normalizedEmail);
};

const normalizeRequestedRole = (role) => {
  const roleValue = String(role || 'Student').trim();
  if (roleValue === 'Faculty') return 'Student';
  const allowedRoles = ['Student', 'Vendor', 'Cab Operator', 'Admin'];
  return allowedRoles.includes(roleValue) ? roleValue : 'Student';
};

const resolveUserRole = async ({ user, requestedRole, email, institutionalDomain }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (user) {
    if (user.role === 'Admin') {
      if (!isAdminEmailAllowed(normalizedEmail)) {
        return { error: 'Admin access is restricted to authorized email addresses only.' };
      }
      return { role: 'Admin' };
    }

    if (user.role === 'Student' || user.role === 'Faculty') {
      if (!isInstitutionalEmail(normalizedEmail, institutionalDomain)) {
        return {
          error: institutionalDomain
            ? `Use your institutional account ending with @${institutionalDomain}`
            : 'Use your NITW institutional account ending with .nitw.ac.in'
        };
      }
      return { role: user.role };
    }

    if (user.role === 'Vendor') {
      if (user.assignedRestaurant) {
        return { role: 'Vendor' };
      }
      return { role: 'Guest' };
    }

    if (user.role === 'Cab Operator') {
      const hasAssignedCab = await Cab.exists({ assignedOperator: user._id });
      return { role: hasAssignedCab ? 'Cab Operator' : 'Guest' };
    }

    if (user.role === 'Guest') {
      if (requestedRole === 'Student') {
        if (!isInstitutionalEmail(normalizedEmail, institutionalDomain)) {
          return {
            error: institutionalDomain
              ? `Use your institutional account ending with @${institutionalDomain}`
              : 'Use your NITW institutional account ending with .nitw.ac.in'
          };
        }
        return { role: 'Student' };
      }

      if (requestedRole === 'Admin') {
        if (!isAdminEmailAllowed(normalizedEmail)) {
          return { error: 'Admin access is restricted to authorized email addresses only.' };
        }
        return { role: 'Admin' };
      }

      return { role: 'Guest' };
    }

    return { role: 'Guest' };
  }

  if (requestedRole === 'Student') {
    if (!isInstitutionalEmail(normalizedEmail, institutionalDomain)) {
      return {
        error: institutionalDomain
          ? `Use your institutional account ending with @${institutionalDomain}`
          : 'Use your NITW institutional account ending with .nitw.ac.in'
      };
    }
    return { role: 'Student' };
  }

  if (requestedRole === 'Admin') {
    if (!isAdminEmailAllowed(normalizedEmail)) {
      return { error: 'Admin access is restricted to authorized email addresses only.' };
    }
    return { role: 'Admin' };
  }

  // Vendor/Cab Operator sign-ins without mapping default to guest access.
  return { role: 'Guest' };
};

const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;

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
    const email = String(payload.email || '').trim().toLowerCase();
    const name = payload.name || email;
    const profilePicture = payload.picture;
    const institutionalDomain = process.env.INSTITUTIONAL_EMAIL_DOMAIN;
    const requestedRole = normalizeRequestedRole(role);
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    const { role: resolvedRole, error: roleError } = await resolveUserRole({
      user,
      requestedRole,
      email,
      institutionalDomain
    });

    if (roleError) {
      await logAuthAttempt({
        action: 'auth_login_failed',
        details: { reason: 'role_access_restricted', email, requestedRole }
      });
      return res.status(403).json({ error: roleError });
    }

    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        profilePicture,
        role: resolvedRole
      });
      await user.save();
    } else {
      const nextProfile = {
        googleId,
        email,
        name,
        profilePicture: profilePicture || user.profilePicture,
        role: resolvedRole
      };
      if (
        user.googleId !== nextProfile.googleId ||
        user.email !== nextProfile.email ||
        user.name !== nextProfile.name ||
        user.profilePicture !== nextProfile.profilePicture ||
        user.role !== nextProfile.role
      ) {
        user.googleId = nextProfile.googleId;
        user.email = nextProfile.email;
        user.name = nextProfile.name;
        user.profilePicture = nextProfile.profilePicture;
        user.role = nextProfile.role;
      }
      await user.save();
    }
    
    const token = issueToken(user);

    await logAuthAttempt({
      action: 'auth_login_success',
      user: user._id,
      details: { email: user.email, role: user.role, requestedRole }
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
    const allowedRoles = ['Student', 'Faculty', 'Vendor', 'Cab Operator', 'Admin', 'Guest'];
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