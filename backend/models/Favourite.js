const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favourite = sequelize.define('Favourite', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    propertyId: { type: DataTypes.INTEGER, allowNull: false },
}, {
    tableName: 'favourites',
    indexes: [{ unique: true, fields: ['userId', 'propertyId'] }],
});

module.exports = Favourite;