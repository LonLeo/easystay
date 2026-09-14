const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true, len: [2, 150] } },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('user', 'owner', 'admin'), defaultValue: 'user', allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    preferredMaxRent: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    preferredPropertyType: {
        type: DataTypes.ENUM('room', 'studio', 'flat', 'house', 'any'),
        defaultValue: 'any',
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'users',
    hooks: {
        beforeCreate: async (user) => {
            user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        },
        beforeUpdate: async (user) => {
            if (user.changed('passwordHash')) {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
            }
        },
    },
});

User.prototype.validatePassword = function (password) {
    return require('bcryptjs').compare(password, this.passwordHash);
};

User.prototype.toSafeObject = function () {
    const { passwordHash, ...safe } = this.toJSON();
    return safe;
};

module.exports = User;