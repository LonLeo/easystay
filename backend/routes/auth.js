const v = require('../middleware/validation');
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', v.register, register);
router.post('/login', v.login, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, v.profile, updateProfile);
router.put('/password', protect, v.password, changePassword);

module.exports = router;