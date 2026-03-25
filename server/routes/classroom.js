const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { getAllClassrooms, createClassroom, updateClassroom } = require('../controllers/classroomController');

const router = express.Router();

router.get('/', getAllClassrooms);
router.post('/', authenticateToken, authorize('Admin'), createClassroom);
router.put('/:id', authenticateToken, authorize('Admin'), updateClassroom);

module.exports = router;