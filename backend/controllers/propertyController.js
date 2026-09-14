const { sendError } = require('../middleware/errors');
const { Op } = require('sequelize');
const { Property, User } = require('../models');

exports.getAllProperties = async (req, res) => {
    try {
        const {
            city, minRent, maxRent, propertyType, furnished,
            billsIncluded, search, page = 1, limit = 12,
        } = req.query;

        const where = { status: 'approved' };
        if (city) where.city = { [Op.like]: `%${city}%` };
        if (propertyType) where.propertyType = propertyType;
        if (furnished !== undefined && furnished !== '') where.furnished = furnished === 'true';
        if (billsIncluded !== undefined && billsIncluded !== '') where.billsIncluded = billsIncluded === 'true';
        if (minRent || maxRent) {
            where.rent = {};
            if (minRent) where.rent[Op.gte] = parseFloat(minRent);
            if (maxRent) where.rent[Op.lte] = parseFloat(maxRent);
        }
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { city: { [Op.like]: `%${search}%` } },
                { address: { [Op.like]: `%${search}%` } },
                { postcode: { [Op.like]: `%${search}%` } },
                { nearbyUniversity: { [Op.like]: `%${search}%` } },
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Property.findAndCountAll({
            where,
            include: [{ model: User, as: 'owner', attributes: ['id', 'fullName', 'email', 'phone'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            success: true,
            data: rows,
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
        });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getPropertyById = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id, {
            include: [{ model: User, as: 'owner', attributes: ['id', 'fullName', 'email', 'phone'] }],
        });
        if (!property || property.status !== 'approved')
            return res.status(404).json({ success: false, message: 'Property not found.' });

        await property.increment('viewCount');
        res.json({ success: true, data: property });
    } catch (err) {
        sendError(res, err);
    }
};

exports.createProperty = async (req, res) => {
    try {
        const {
            title, description, city, address, postcode, rent, deposit,
            propertyType, furnished, billsIncluded, contractLengthMonths,
            bedroomCount, bathroomCount, imageUrl, imageUrls,
            availableFrom, nearbyUniversity,
        } = req.body;

        if (!title || !description || !city || !address || rent === undefined || rent === null)
            return res.status(400).json({ success: false, message: 'Title, description, city, address, and rent are required.' });

        const property = await Property.create({
            ownerId: req.user.id, title, description, city, address, postcode,
            rent, deposit, propertyType, furnished, billsIncluded,
            contractLengthMonths, bedroomCount, bathroomCount, imageUrl, imageUrls,
            availableFrom, nearbyUniversity, status: 'pending',
        });

        res.status(201).json({ success: true, message: 'Property submitted for review.', data: property });
    } catch (err) {
        sendError(res, err);
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
        if (property.ownerId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorised.' });

        const allowed = ['title', 'description', 'city', 'address', 'postcode', 'rent', 'deposit', 'propertyType', 'furnished', 'billsIncluded', 'contractLengthMonths', 'bedroomCount', 'bathroomCount', 'imageUrl', 'imageUrls', 'availableFrom', 'nearbyUniversity'];
        const updates = Object.fromEntries(allowed.filter(key => Object.hasOwn(req.body, key)).map(key => [key, req.body[key]]));
        await property.update({ ...updates, status: 'pending' });
        res.json({ success: true, message: 'Property updated and resubmitted for review.', data: property });
    } catch (err) {
        sendError(res, err);
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
        if (property.ownerId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorised.' });

        await property.destroy();
        res.json({ success: true, message: 'Property deleted.' });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getOwnerProperties = async (req, res) => {
    try {
        const properties = await Property.findAll({
            where: { ownerId: req.user.id },
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: properties });
    } catch (err) {
        sendError(res, err);
    }
};
exports.getManagedProperty = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
        if (property.ownerId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorised.' });
        res.json({ success: true, data: property });
    } catch (err) { sendError(res, err); }
};
