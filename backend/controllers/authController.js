const { getJwtSecret } = require('../config/jwt');
const { sendError } = require('../middleware/errors');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (id) =>
    jwt.sign({ id }, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role, phone } = req.body;
        if (!fullName || !email || !password)
            return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
        if (password.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

        const existing = await User.findOne({ where: { email } });
        if (existing)
            return res.status(409).json({ success: false, message: 'Email already registered.' });

        const allowedRoles = ['user', 'owner'];
        const assignedRole = allowedRoles.includes(role) ? role : 'user';

        const user = await User.create({ fullName, email, passwordHash: password, role: assignedRole, phone });
        const token = signToken(user.id);

        res.status(201).json({ success: true, message: 'Registration successful.', token, user: user.toSafeObject() });
    } catch (err) {
        sendError(res, err);
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required.' });

        const user = await User.findOne({ where: { email } });
        if (!user || !(await user.validatePassword(password)))
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        if (!user.isActive)
            return res.status(403).json({ success: false, message: 'Account is deactivated.' });

        const token = signToken(user.id);
        res.json({ success: true, message: 'Login successful.', token, user: user.toSafeObject() });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getMe = async (req, res) => {
    res.json({ success: true, user: req.user.toSafeObject() });
};

exports.updateProfile = async (req, res) => {
    try {
        const { fullName, phone, bio, preferredMaxRent, preferredPropertyType } = req.body;
        await req.user.update({ fullName, phone, bio, preferredMaxRent, preferredPropertyType });
        res.json({ success: true, message: 'Profile updated.', user: req.user.toSafeObject() });
    } catch (err) {
        sendError(res, err);
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!await req.user.validatePassword(currentPassword))
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        await req.user.update({ passwordHash: newPassword });
        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        sendError(res, err);
    }
};