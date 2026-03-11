const User = require("./user.model");
const Category = require("./category.model");
const Task = require("./task.model");
const Expense = require("./expense.model");

User.hasMany(Category, { foreignKey: "user_id" });
Category.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Task, { foreignKey: "user_id" });
Task.belongsTo(User, { foreignKey: "user_id" });

Category.hasMany(Task, { foreignKey: "category_id" });
Task.belongsTo(Category, { foreignKey: "category_id" });

User.hasMany(Expense, { foreignKey: "user_id" });
Expense.belongsTo(User, { foreignKey: "user_id" });

Task.hasMany(Expense, { foreignKey: "task_id" });
Expense.belongsTo(Task, { foreignKey: "task_id" });

Category.hasMany(Expense, { foreignKey: "category_id" });
Expense.belongsTo(Category, { foreignKey: "category_id" });

module.exports = { User, Category, Task, Expense };
