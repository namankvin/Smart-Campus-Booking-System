const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  getPendingBookings,
  approveBooking,
  rejectBooking,
  updateOrderStatus,
  generateReports,
  getClassroomsByAdmin
} = require('../controllers/adminController');

module.exports = (io) => {
  const router = express.Router();
  
  router.get('/bookings/pending', authenticateToken, authorize('Admin'), getPendingBookings);
  router.post('/bookings/:id/approve', authenticateToken, authorize('Admin'), (req, res) => approveBooking(req, res, io));
  router.post('/bookings/:id/reject', authenticateToken, authorize('Admin'), (req, res) => rejectBooking(req, res, io));
  router.put('/orders/:id/status', authenticateToken, authorize('Vendor'), (req, res) => updateOrderStatus(req, res, io));
  router.get('/reports', authenticateToken, authorize('Admin'), generateReports);
  router.get('/classrooms', authenticateToken, authorize('Admin'), getClassroomsByAdmin);
  
  return router;
};