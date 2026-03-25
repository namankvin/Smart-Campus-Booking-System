const express = require('express');
const router = express.Router();
const { googleLogin, getProfile, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/google-login', googleLogin);
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);

module.exports = router;