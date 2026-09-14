const v = require('../middleware/validation');
const express = require('express');
const router = express.Router();
const { addFavourite, removeFavourite, getUserFavourites } = require('../controllers/favouriteController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getUserFavourites);
router.post('/', protect, v.favourite, addFavourite);
router.delete('/:propertyId', protect, v.id('propertyId'), removeFavourite);

module.exports = router;