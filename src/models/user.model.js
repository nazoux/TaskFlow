const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  avatar: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verify_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: "users",
  timestamps: false
});

module.exports = User;