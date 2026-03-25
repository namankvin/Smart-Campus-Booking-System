const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAvailableCabs, createCab, updateCabStatus } = require('../controllers/cabController');

module.exports = (io) => {
  const router = express.Router();
  
  router.get('/', getAvailableCabs);
  router.post('/', authenticateToken, createCab);
  router.put('/:id', authenticateToken, (req, res) => updateCabStatus(req, res, io));
  
  return router;
};