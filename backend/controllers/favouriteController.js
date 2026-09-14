const { sendError } = require('../middleware/errors');
const { Favourite, Property, User } = require('../models');

exports.addFavourite = async (req, res) => {
    try {
        const { propertyId } = req.body;
        const property = await Property.findByPk(propertyId);
        if (!property || property.status !== 'approved')
            return res.status(404).json({ success: false, message: 'Property not found.' });

        const [fav, created] = await Favourite.findOrCreate({
            where: { userId: req.user.id, propertyId: parseInt(propertyId) },
        });

        if (!created) return res.status(409).json({ success: false, message: 'Already in favourites.' });
        res.status(201).json({ success: true, message: 'Added to favourites.', data: fav });
    } catch (err) {
        sendError(res, err);
    }
};

exports.removeFavourite = async (req, res) => {
    try {
        const deleted = await Favourite.destroy({
            where: { userId: req.user.id, propertyId: parseInt(req.params.propertyId) },
        });
        if (!deleted) return res.status(404).json({ success: false, message: 'Favourite not found.' });
        res.json({ success: true, message: 'Removed from favourites.' });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getUserFavourites = async (req, res) => {
    try {
        const favourites = await Favourite.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Property, as: 'property', where: { status: 'approved' }, required: true,
                include: [{ model: User, as: 'owner', attributes: ['id', 'fullName', 'email'] }],
            }],
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: favourites });
    } catch (err) {
        sendError(res, err);
    }
};