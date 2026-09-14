const { body, param, query, validationResult } = require('express-validator');
const types = ['room', 'studio', 'flat', 'house'];
const finish = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array().map(e => `${e.path}: ${e.msg}`).join('; ') });
    next();
};
const text = (field, min, max) => body(field).isString().bail().trim().isLength({ min, max });
const optional = chain => chain.optional({ values: 'null' });
const emptyToNull = value => value === '' ? null : value;
const money = field => body(field).customSanitizer(emptyToNull).optional({ values: 'null' }).isFloat({ min: 0, max: 99999999.99 });
const date = field => body(field).customSanitizer(emptyToNull).optional({ values: 'null' }).isISO8601({ strict: true, strictSeparator: true }).matches(/^\d{4}-\d{2}-\d{2}$/);
const id = field => [param(field).isInt({ min: 1, max: 2147483647 }).toInt(), finish];
const propertyId = body('propertyId').isInt({ min: 1, max: 2147483647 }).toInt();
const password = field => body(field).isString().bail().isLength({ min: 6 }).custom(v => Buffer.byteLength(v, 'utf8') <= 72).withMessage('Password must use at most 72 UTF-8 bytes');
const register = [text('fullName', 2, 150), body('email').isString().bail().trim().isEmail().isLength({ max: 255 }), password('password'), optional(text('phone', 0, 30)), finish];
const login = [body('email').isString().bail().trim().isEmail(), body('password').isString().bail().notEmpty(), finish];
const preferences = [money('preferredMaxRent'), body('preferredPropertyType').optional().isIn([...types, 'any'])];
const profile = [optional(text('fullName', 2, 150)), optional(text('phone', 0, 30)), optional(text('bio', 0, 5000)), ...preferences, finish];
function property(update = false) {
    const required = chain => update ? chain.optional() : chain;
    return [required(text('title', 5, 200)), required(text('description', 1, 20000)), required(text('city', 1, 100)), required(text('address', 1, 300)),
        required(body('rent').isFloat({ min: 0, max: 99999999.99 })), money('deposit'),
        body('propertyType').optional().isIn(types),
        ...['furnished', 'billsIncluded'].map(f => body(f).optional().isBoolean({ strict: true })),
        ...['contractLengthMonths', 'bedroomCount', 'bathroomCount'].map(f => body(f).customSanitizer(emptyToNull).optional({ values: 'null' }).isInt({ min: 1, max: 1200 })),
        optional(text('postcode', 0, 20)), optional(text('nearbyUniversity', 0, 200)),
        body('imageUrl').customSanitizer(emptyToNull).optional({ values: 'null' }).isURL({ protocols: ['http', 'https'], require_protocol: true }).isLength({ max: 500 }),
        body('imageUrls').optional({ values: 'null' }).isArray({ max: 20 }),
        body('imageUrls.*').isURL({ protocols: ['http', 'https'], require_protocol: true }).isLength({ max: 500 }), date('availableFrom'), finish];
}
const filters = [
    ...['city', 'search'].map(f => query(f).optional().isString().bail().trim().isLength({ max: 200 })),
    ...['minRent', 'maxRent'].map(f => query(f).optional({ values: 'falsy' }).isFloat({ min: 0, max: 99999999.99 })),
    query('propertyType').optional({ values: 'falsy' }).isIn(types),
    ...['furnished', 'billsIncluded'].map(f => query(f).optional({ values: 'falsy' }).isIn(['true', 'false'])),
    query('page').optional().isInt({ min: 1, max: 1000000 }), query('limit').optional().isInt({ min: 1, max: 100 }),
    query('maxRent').custom((v, { req }) => !v || !req.query.minRent || Number(v) >= Number(req.query.minRent)).withMessage('Must be at least minRent'), finish];
const readiness = [propertyId, money('maxBudget'), body('preferredType').optional({ values: 'null' }).isIn([...types, 'any']), finish];
const enquiry = [propertyId, text('message', 10, 5000), date('moveInDate'), finish];
module.exports = { id, register, login, profile, property, filters, readiness, enquiry,
    favourite: [propertyId, finish], reply: [text('replyMessage', 1, 5000), finish],
    password: [body('currentPassword').isString().bail().notEmpty(), password('newPassword'), finish] };
