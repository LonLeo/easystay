const { sendError } = require('../middleware/errors');
const { Property, User, Enquiry } = require('../models');

exports.getPendingProperties = async (req, res) => {
    try {
        const properties = await Property.findAll({
            where: { status: 'pending' },
            include: [{ model: User, as: 'owner', attributes: ['id', 'fullName', 'email'] }],
            order: [['createdAt', 'ASC']],
        });
        res.json({ success: true, data: properties });
    } catch (err) {
        sendError(res, err);
    }
};

exports.reviewProperty = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status))
            return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });

        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

        await property.update({ status });
        res.json({ success: true, message: `Property ${status}.`, data: property });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['passwordHash'] },
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: users });
    } catch (err) {
        sendError(res, err);
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admins.' });

        await user.update({ isActive: !user.isActive });
        res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: user.toSafeObject() });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalProperties, approvedProperties, pendingProperties, totalEnquiries] =
            await Promise.all([
                User.count(),
                Property.count(),
                Property.count({ where: { status: 'approved' } }),
                Property.count({ where: { status: 'pending' } }),
                Enquiry.count(),
            ]);

        res.json({
            success: true,
            data: { totalUsers, totalProperties, approvedProperties, pendingProperties, totalEnquiries },
        });
    } catch (err) {
        sendError(res, err);
    }
};