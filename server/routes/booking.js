const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  createClassroomBooking,
  getUserBookings,
  cancelBooking,
  placeFoodOrder,
  bookCab
} = require('../controllers/bookingController');

module.exports = (io) => {
  const router = express.Router();
  
  router.post('/classroom', authenticateToken, (req, res) => createClassroomBooking(req, res, io));
  router.get('/', authenticateToken, getUserBookings);
  router.delete('/:id', authenticateToken, (req, res) => cancelBooking(req, res, io));
  router.post('/food', authenticateToken, (req, res) => placeFoodOrder(req, res, io));
  router.post('/cab', authenticateToken, (req, res) => bookCab(req, res, io));
  
  return router;
};