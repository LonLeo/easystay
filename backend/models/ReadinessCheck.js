const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReadinessCheck = sequelize.define('ReadinessCheck', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    propertyId: { type: DataTypes.INTEGER, allowNull: false },
    result: { type: DataTypes.ENUM('Good Fit', 'Needs Checking', 'Potential Risk'), allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 100, isInt: true } },
    reasons: { type: DataTypes.JSON, allowNull: true, get() { return require('./jsonArray')(this.getDataValue('reasons')); } },
    userMaxBudget: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    userPreferredType: { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: 'readiness_checks', indexes: [{ fields: ['userId', 'createdAt'] }, { fields: ['propertyId'] }] });

module.exports = ReadinessCheck;