const v = require('../middleware/validation');
const express = require('express');
const router = express.Router();
const {
    getAllProperties, getPropertyById, getManagedProperty, createProperty,
    updateProperty, deleteProperty, getOwnerProperties,
} = require('../controllers/propertyController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', v.filters, getAllProperties);
router.get('/my', protect, requireRole('owner', 'admin'), getOwnerProperties);
router.get('/my/:id', protect, requireRole('owner', 'admin'), v.id('id'), getManagedProperty);
router.get('/:id', v.id('id'), getPropertyById);
router.post('/', protect, requireRole('owner', 'admin'), v.property(), createProperty);
router.put('/:id', protect, requireRole('owner', 'admin'), v.id('id'), v.property(true), updateProperty);
router.delete('/:id', protect, requireRole('owner', 'admin'), v.id('id'), deleteProperty);

module.exports = router;