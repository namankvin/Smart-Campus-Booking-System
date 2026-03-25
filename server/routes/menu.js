const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { getMenuByVendor, addMenuItems, updateMenuItems } = require('../controllers/menuController');

module.exports = (io) => {
  const router = express.Router();
  
  router.get('/', getMenuByVendor);
  router.post('/', authenticateToken, authorize('Vendor'), (req, res) => addMenuItems(req, res, io));
  router.put('/', authenticateToken, authorize('Vendor'), (req, res) => updateMenuItems(req, res, io));
  
  return router;
};