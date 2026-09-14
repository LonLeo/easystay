const v = require('../middleware/validation');
const express = require('express');
const router = express.Router();
const { runReadinessCheck, getHistory } = require('../controllers/readinessController');
const { optionalAuth, protect } = require('../middleware/auth');

router.post('/check', optionalAuth, v.readiness, runReadinessCheck);

router.get('/history', protect, getHistory);

module.exports = router;