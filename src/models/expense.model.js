const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Expense = sequelize.define("Expense", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  year: {
    type: DataTypes.SMALLINT,
    allowNull: false
  },
  month: {
    type: DataTypes.TINYINT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'expense'
  },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  recurring_start_year: {
    type: DataTypes.SMALLINT,
    allowNull: true
  },
  recurring_start_month: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  recurring_end_year: {
    type: DataTypes.SMALLINT,
    allowNull: true
  },
  recurring_end_month: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: "expenses",
  timestamps: false
});

module.exports = Expense;
