const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Property = sequelize.define('Property', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true, len: [5, 200] } },
    description: { type: DataTypes.TEXT, allowNull: false },
    city: { type: DataTypes.STRING(100), allowNull: false },
    address: { type: DataTypes.STRING(300), allowNull: false },
    postcode: { type: DataTypes.STRING(20), allowNull: true },
    rent: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    deposit: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    propertyType: {
        type: DataTypes.ENUM('room', 'studio', 'flat', 'house'),
        allowNull: false,
        defaultValue: 'room',
    },
    furnished: { type: DataTypes.BOOLEAN, defaultValue: false },
    billsIncluded: { type: DataTypes.BOOLEAN, defaultValue: false },
    contractLengthMonths: { type: DataTypes.INTEGER, allowNull: true },
    bedroomCount: { type: DataTypes.INTEGER, defaultValue: 1 },
    bathroomCount: { type: DataTypes.INTEGER, defaultValue: 1 },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true },
    imageUrls: { type: DataTypes.JSON, allowNull: true, get() { return require('./jsonArray')(this.getDataValue('imageUrls')); } },
    availableFrom: { type: DataTypes.DATEONLY, allowNull: true },
    nearbyUniversity: { type: DataTypes.STRING(200), allowNull: true },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'archived'),
        defaultValue: 'pending',
    },
    viewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
    tableName: 'properties',
    indexes: [
        { fields: ['city'] }, { fields: ['rent'] }, { fields: ['ownerId'] },
        { fields: ['status'] }, { fields: ['propertyType'] },
    ],
});

module.exports = Property;