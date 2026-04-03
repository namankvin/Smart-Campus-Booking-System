const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  getAvailableCabs,
  createCab,
  updateCabStatus,
  getOperatorCabStats
} = require('../controllers/cabController');

module.exports = (io) => {
  const router = express.Router();
  
  router.get('/', getAvailableCabs);
  router.get('/operator/my-stats', authenticateToken, authorize('Cab Operator'), getOperatorCabStats);
  router.post('/', authenticateToken, authorize('Admin'), createCab);
  router.put('/:id', authenticateToken, authorize('Admin'), (req, res) => updateCabStatus(req, res, io));
  
  return router;
};