function sendError(res, err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, message: 'This record already exists.' });
    }
    if (['SequelizeValidationError', 'SequelizeForeignKeyConstraintError'].includes(err.name)) {
        return res.status(400).json({ success: false, message: 'Invalid input or related record.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error.' });
}
module.exports = { sendError };
