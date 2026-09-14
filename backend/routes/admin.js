const v = require('../middleware/validation');
const express = require('express');
const router = express.Router();
const { getPendingProperties, reviewProperty, getAllUsers, toggleUserStatus, getDashboardStats } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect, requireRole('admin'));

router.get('/stats', getDashboardStats);
router.get('/properties/pending', getPendingProperties);
router.put('/properties/:id/review', v.id('id'), reviewProperty);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', v.id('id'), toggleUserStatus);

module.exports = router;