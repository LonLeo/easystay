const v = require('../middleware/validation');
const express = require('express');
const router = express.Router();
const {
  createEnquiry,
  getUserEnquiries,
  getOwnerEnquiries,
  updateEnquiryStatus,
  replyToEnquiry,
} = require('../controllers/enquiryController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/', protect, v.enquiry, createEnquiry);
router.get('/my', protect, getUserEnquiries);
router.get('/received', protect, requireRole('owner', 'admin'), getOwnerEnquiries);
router.put('/:id/status', protect, requireRole('owner', 'admin'), v.id('id'), updateEnquiryStatus);
router.put('/:id/reply', protect, requireRole('owner', 'admin'), v.id('id'), v.reply, replyToEnquiry);

module.exports = router;