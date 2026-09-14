const sequelize = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const Favourite = require('./Favourite');
const Enquiry = require('./Enquiry');
const ReadinessCheck = require('./ReadinessCheck');

User.hasMany(Property, { foreignKey: 'ownerId', as: 'properties', onDelete: 'CASCADE' });
Property.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Favourite, { foreignKey: 'userId', as: 'favourites', onDelete: 'CASCADE' });
Favourite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Property.hasMany(Favourite, { foreignKey: 'propertyId', as: 'favourites', onDelete: 'CASCADE' });
Favourite.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

User.hasMany(Enquiry, { foreignKey: 'userId', as: 'enquiries', onDelete: 'CASCADE' });
Enquiry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Property.hasMany(Enquiry, { foreignKey: 'propertyId', as: 'enquiries', onDelete: 'CASCADE' });
Enquiry.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

User.hasMany(ReadinessCheck, { foreignKey: 'userId', as: 'readinessChecks', onDelete: 'SET NULL' });
ReadinessCheck.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Property.hasMany(ReadinessCheck, { foreignKey: 'propertyId', as: 'readinessChecks', onDelete: 'CASCADE' });
ReadinessCheck.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

module.exports = { sequelize, User, Property, Favourite, Enquiry, ReadinessCheck };