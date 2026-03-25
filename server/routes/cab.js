const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { getAvailableCabs, createCab, updateCabStatus } = require('../controllers/cabController');

module.exports = (io) => {
  const router = express.Router();
  
  router.get('/', getAvailableCabs);
  router.post('/', authenticateToken, authorize('Cab Operator', 'Admin'), createCab);
  router.put('/:id', authenticateToken, authorize('Cab Operator', 'Admin'), (req, res) => updateCabStatus(req, res, io));
  
  return router;
};