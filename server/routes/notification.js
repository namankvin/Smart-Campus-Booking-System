const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', authenticateToken, getMyNotifications);
router.patch('/read-all', authenticateToken, markAllNotificationsRead);
router.patch('/:id/read', authenticateToken, markNotificationRead);

module.exports = router;
