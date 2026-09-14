const { sendError } = require('../middleware/errors');
const { Property, ReadinessCheck } = require('../models');

// Rental Readiness Assistant — rules-based scoring engine
function calculateReadiness(property, userPrefs = {}) {
    let score = 0;
    const reasons = [];
    const maxScore = 100;

    const rent = property.rent == null || property.rent === '' ? NaN : Number(property.rent);
    const deposit = property.deposit == null || property.deposit === '' ? NaN : Number(property.deposit);
    const userBudget = userPrefs.maxBudget == null || userPrefs.maxBudget === '' ? null : Number(userPrefs.maxBudget);

    // 1. Budget check (25 pts)
    if (!Number.isFinite(rent) || rent < 0) {
        reasons.push({ type: 'warning', text: 'Rent is not specified - confirm the monthly rent before assessing affordability.' });
    } else if (Number.isFinite(userBudget) && userBudget >= 0) {
        if (rent <= userBudget) {
            score += 25;
            reasons.push({ type: 'positive', text: `Rent (£${rent}/mo) is within your budget of £${userBudget}/mo.` });
        } else {
            const over = ((rent - userBudget) / userBudget * 100).toFixed(0);
            reasons.push({ type: 'negative', text: `Rent is £${(rent - userBudget).toFixed(2)} over your stated budget ${userBudget > 0 ? `(${over}% above)` : '(zero budget stated)'}.` });
        }
    } else {
        score += 12;
        reasons.push({ type: 'neutral', text: 'No budget preference set — unable to check affordability.' });
    }

    // 2. Bills included (20 pts)
    if (property.billsIncluded === true || property.billsIncluded === 1) {
        score += 20;
        reasons.push({ type: 'positive', text: 'Bills are included — good for predictable budgeting as a newcomer.' });
    } else if (property.billsIncluded == null) {
        reasons.push({ type: 'warning', text: 'Bills inclusion is unspecified - confirm utility costs.' });
    } else {
        reasons.push({ type: 'negative', text: 'Bills not included — budget for additional utility costs.' });
    }

    // 3. Deposit transparency (15 pts)
    if (Number.isFinite(deposit) && deposit >= 0) {
        score += 15;
        reasons.push({ type: 'positive', text: `Deposit is clearly stated at £${deposit}.` });
    } else {
        reasons.push({ type: 'warning', text: 'Deposit amount is not specified — ask the landlord before proceeding.' });
    }

    // 4. Furnished status (15 pts)
    if (property.furnished === true || property.furnished === 1) {
        score += 15;
        reasons.push({ type: 'positive', text: 'Property is furnished — ideal for newcomers without existing furniture.' });
    } else if (property.furnished == null) {
        reasons.push({ type: 'warning', text: 'Furnished status is unspecified - confirm what furniture is supplied.' });
    } else {
        reasons.push({ type: 'warning', text: 'Property is unfurnished — factor in the cost and logistics of furnishing.' });
    }

    // 5. Contract flexibility (10 pts)
    const contractMonths = Number(property.contractLengthMonths);
    if (!Number.isInteger(contractMonths) || contractMonths <= 0) {
        reasons.push({ type: 'warning', text: 'Contract length is not specified - confirm the duration and flexibility.' });
    } else if (contractMonths <= 6) {
        score += 10;
        reasons.push({ type: 'positive', text: `Short contract (${contractMonths} months) — flexible for students.` });
    } else if (contractMonths <= 12) {
        score += 7;
        reasons.push({ type: 'neutral', text: `Standard ${contractMonths}-month contract — typical for most rentals.` });
    } else {
        reasons.push({ type: 'warning', text: `Long contract (${contractMonths} months) — may not suit short study periods.` });
    }

    // 6. Listing completeness (10 pts)
    const filled = [property.description, property.address, property.city, property.imageUrl || property.imageUrls?.[0], property.nearbyUniversity].filter(v => typeof v === 'string' && v.trim()).length;
    if (filled >= 4) {
        score += 10;
        reasons.push({ type: 'positive', text: 'Listing contains most of the assessed information; accuracy and landlord identity have not been verified.' });
    } else if (filled >= 2) {
        score += 5;
        reasons.push({ type: 'warning', text: 'Listing has some missing details — request more information before deciding.' });
    } else {
        reasons.push({ type: 'negative', text: 'Listing is incomplete — verify all details directly with the owner.' });
    }

    // 7. Property type preference (5 pts)
    if (userPrefs.preferredType && userPrefs.preferredType !== 'any') {
        if (property.propertyType === userPrefs.preferredType) {
            score += 5;
            reasons.push({ type: 'positive', text: `Property type (${property.propertyType}) matches your preference.` });
        } else {
            reasons.push({ type: 'neutral', text: `Property type (${property.propertyType}) differs from your preference (${userPrefs.preferredType}).` });
        }
    } else {
        score += 5;
        reasons.push({ type: 'neutral', text: 'No specific property type preference - any type is accepted.' });
    }

    // Result classification
    const percentage = Math.round((score / maxScore) * 100);
    const result = classifyScore(percentage);

    return { score: percentage, result, reasons };
}

exports.runReadinessCheck = async (req, res) => {
    try {
        const { propertyId, maxBudget, preferredType } = req.body;
        if (!propertyId)
            return res.status(400).json({ success: false, message: 'Property ID is required.' });

        const property = await Property.findByPk(propertyId);
        if (!property || property.status !== 'approved')
            return res.status(404).json({ success: false, message: 'Property not found.' });

        const userPrefs = {
            maxBudget: maxBudget === undefined ? req.user?.preferredMaxRent : maxBudget,
            preferredType: preferredType === undefined ? req.user?.preferredPropertyType : preferredType,
        };
        const { score, result, reasons } = calculateReadiness(property, userPrefs);

        // Optionally store the check
        if (req.user) {
            await ReadinessCheck.create({
                userId: req.user.id,
                propertyId: property.id,
                result,
                score,
                reasons,
                userMaxBudget: userPrefs.maxBudget ?? null,
                userPreferredType: userPrefs.preferredType ?? null,
            });
        }

        res.json({ success: true, data: { propertyId: property.id, result, score, reasons } });
    } catch (err) {
        sendError(res, err);
    }
};
function classifyScore(score) {
    if (!Number.isInteger(score) || score < 0 || score > 100) throw new RangeError('Score must be an integer from 0 to 100.');
    return score >= 70 ? 'Good Fit' : score >= 45 ? 'Needs Checking' : 'Potential Risk';
}
exports.calculateReadiness = calculateReadiness;
exports.classifyScore = classifyScore;
exports.getHistory = async (req, res) => {
    try {
        const data = await ReadinessCheck.findAll({
            where: { userId: req.user.id },
            include: [{ model: Property, as: 'property', attributes: ['id', 'title', 'status'], where: { status: 'approved' }, required: false }],
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
        });
        res.json({ success: true, data });
    } catch (err) { sendError(res, err); }
};
