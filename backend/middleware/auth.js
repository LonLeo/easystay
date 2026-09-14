const { getJwtSecret } = require('../config/jwt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });

        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findByPk(decoded.id);
        if (!user || !user.isActive)
            return res.status(401).json({ success: false, message: 'Invalid token or user deactivated.' });

        req.user = user;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Token verification failed.' });
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
        return res.status(403).json({ success: false, message: 'Access denied.' });
    next();
};

const optionalAuth = (req, res, next) => {
    if (!req.headers.authorization) return next();
    return protect(req, res, next);
};

module.exports = { protect, requireRole, optionalAuth };