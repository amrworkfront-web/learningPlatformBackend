const express = require('express');
const router = express.Router();
const {
  getInstructorStats,
  getAdminStats
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/instructor', protect, authorize('instructor', 'admin'), getInstructorStats);
router.get('/admin', protect, authorize('admin'), getAdminStats);

module.exports = router;
