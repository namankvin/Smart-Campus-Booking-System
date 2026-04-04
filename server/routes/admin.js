const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  getPendingBookings,
  approveBooking,
  rejectBooking,
  updateOrderStatus,
  generateReports,
  getClassroomsByAdmin,
  getFleetCabs,
  getUsers,
  updateUserRole,
  getVendorOrders,
  updateVendorRestaurantMapping,
  updateCabOperatorMapping,
  deleteUser
} = require('../controllers/adminController');

module.exports = (io) => {
  const router = express.Router();
  
  router.get('/bookings/pending', authenticateToken, authorize('Admin'), getPendingBookings);
  router.post('/bookings/:id/approve', authenticateToken, authorize('Admin'), (req, res) => approveBooking(req, res, io));
  router.post('/bookings/:id/reject', authenticateToken, authorize('Admin'), (req, res) => rejectBooking(req, res, io));
  router.put('/orders/:id/status', authenticateToken, authorize('Vendor'), (req, res) => updateOrderStatus(req, res, io));
  router.get('/vendor/orders', authenticateToken, authorize('Vendor'), getVendorOrders);
  router.get('/reports', authenticateToken, authorize('Admin'), generateReports);
  router.get('/classrooms', authenticateToken, authorize('Admin'), getClassroomsByAdmin);
  router.get('/cabs', authenticateToken, authorize('Admin'), getFleetCabs);
  router.get('/users', authenticateToken, authorize('Admin'), getUsers);
  router.put('/users/:id/role', authenticateToken, authorize('Admin'), updateUserRole);
  router.put('/users/:id/vendor-mapping', authenticateToken, authorize('Admin'), updateVendorRestaurantMapping);
  router.put('/users/:id/cab-mapping', authenticateToken, authorize('Admin'), updateCabOperatorMapping);
  router.delete('/users/:id', authenticateToken, authorize('Admin'), deleteUser);
  
  return router;
};