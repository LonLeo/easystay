const { sendError } = require('../middleware/errors');
const { Enquiry, Property, User } = require('../models');

exports.createEnquiry = async (req, res) => {
    try {
        const { propertyId, message, moveInDate } = req.body;
        if (!propertyId || !message) {
            return res.status(400).json({ success: false, message: 'Property ID and message are required.' });
        }

        const property = await Property.findByPk(propertyId);
        if (!property || property.status !== 'approved') {
            return res.status(404).json({ success: false, message: 'Property not found.' });
        }

        const enquiry = await Enquiry.create({
            userId: req.user.id,
            propertyId: parseInt(propertyId, 10),
            message,
            senderName: req.user.fullName,
            senderEmail: req.user.email,
            moveInDate: moveInDate || null,
            status: 'unread',
        });

        res.status(201).json({ success: true, message: 'Enquiry sent successfully.', data: enquiry });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getUserEnquiries = async (req, res) => {
    try {
        const enquiries = await Enquiry.findAll({
            where: { userId: req.user.id },
            include: [{ model: Property, as: 'property', attributes: ['id', 'title', 'city', 'rent', 'imageUrl'] }],
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: enquiries });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getOwnerEnquiries = async (req, res) => {
    try {
        const properties = await Property.findAll({
            where: { ownerId: req.user.id },
            attributes: ['id'],
        });

        const propertyIds = properties.map((p) => p.id);

        const enquiries = await Enquiry.findAll({
            where: { propertyId: propertyIds },
            include: [
                { model: Property, as: 'property', attributes: ['id', 'title', 'city', 'rent'] },
                { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json({ success: true, data: enquiries });
    } catch (err) {
        sendError(res, err);
    }
};

exports.updateEnquiryStatus = async (req, res) => {
    try {
        const enquiry = await Enquiry.findByPk(req.params.id, {
            include: [{ model: Property, as: 'property' }],
        });

        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry not found.' });
        }

        if (enquiry.property.ownerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorised.' });
        }

        const { status } = req.body;
        if (!['unread', 'read', 'replied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        await enquiry.update({
            status,
            repliedAt: status === 'replied' ? new Date() : enquiry.repliedAt,
        });

        res.json({ success: true, message: 'Enquiry status updated.', data: enquiry });
    } catch (err) {
        sendError(res, err);
    }
};

exports.replyToEnquiry = async (req, res) => {
    try {
        const { replyMessage } = req.body;
        if (!replyMessage || !replyMessage.trim()) {
            return res.status(400).json({ success: false, message: 'Reply message is required.' });
        }

        const enquiry = await Enquiry.findByPk(req.params.id, {
            include: [{ model: Property, as: 'property' }],
        });

        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry not found.' });
        }

        if (enquiry.property.ownerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorised.' });
        }

        await enquiry.update({
            replyMessage: replyMessage.trim(),
            status: 'replied',
            repliedAt: new Date(),
        });

        res.json({ success: true, message: 'Reply sent successfully.', data: enquiry });
    } catch (err) {
        sendError(res, err);
    }
};