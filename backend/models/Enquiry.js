const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enquiry = sequelize.define('Enquiry', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    propertyId: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    senderName: { type: DataTypes.STRING(150), allowNull: true },
    senderEmail: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM('unread', 'read', 'replied'), defaultValue: 'unread' },
    moveInDate: { type: DataTypes.DATEONLY, allowNull: true },
    replyMessage: { type: DataTypes.TEXT, allowNull: true },
    repliedAt: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'enquiries',
    indexes: [
        { fields: ['userId'] },
        { fields: ['propertyId'] },
        { fields: ['status'] },
    ],
});

module.exports = Enquiry;