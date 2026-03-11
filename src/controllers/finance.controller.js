const sequelize = require("../config/database");
const { Op } = require("sequelize");
const { Expense, Task, Category } = require("../models");

exports.setIncome = async (req, res) => {
  try {
    const { year, month, amount, label } = req.body;

    const existing = await Expense.findOne({
      where: { user_id: req.userId, year, month, type: 'income' }
    });

    if (existing) {
      await existing.update({ amount, label: label || 'Salaire' });
      return res.json(existing);
    }

    const income = await Expense.create({
      user_id: req.userId,
      task_id: null,
      category_id: null,
      amount,
      label: label || 'Salaire',
      expense_date: `${year}-${String(month).padStart(2, '0')}-01`,
      year,
      month,
      type: 'income',
      created_at: new Date()
    });

    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const monthsBack = Math.min(parseInt(req.query.months) || 6, 24);
    const now = new Date();
    const results = [];
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const incomeRow = await Expense.findOne({
        attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total"]],
        where: { user_id: req.userId, year, month, type: 'income' },
        raw: true
      });

      const actualRow = await Expense.findOne({
        attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total"]],
        where: { user_id: req.userId, year, month, type: 'expense' },
        raw: true
      });

      const isCurrentMonth = year === now.getFullYear() && month === (now.getMonth() + 1);
      let forecastRow = { total: 0 };
      if (isCurrentMonth) {
        forecastRow = await Task.findOne({
          attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("budget")), 0), "total"]],
          where: {
            user_id: req.userId,
            status: { [Op.ne]: "done" },
            budget: { [Op.not]: null }
          },
          raw: true
        });
      }

      const budgeted = parseFloat(incomeRow.total);
      const actual = parseFloat(actualRow.total);
      const forecast = parseFloat(forecastRow.total);

      results.push({
        year,
        month,
        label: `${monthNames[month - 1]} ${year}`,
        budgeted,
        actual,
        forecast,
        remaining: budgeted - actual
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    const rows = await Expense.findAll({
      attributes: [
        "category_id",
        [sequelize.fn("SUM", sequelize.col("Expense.amount")), "total"]
      ],
      where: { user_id: req.userId, year, month, type: 'expense' },
      include: [{
        model: Category,
        attributes: ["name", "color"],
        required: false
      }],
      group: ["category_id", "Category.id"],
      raw: true,
      nest: true
    });

    const data = rows.map(r => ({
      categoryId: r.category_id,
      categoryName: r.Category ? r.Category.name : "Sans catégorie",
      categoryColor: r.Category ? r.Category.color : "#94a3b8",
      total: parseFloat(r.total)
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const results = [];

    for (let m = 1; m <= 12; m++) {
      const incomeRow = await Expense.findOne({
        attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total"]],
        where: { user_id: req.userId, year, month: m, type: 'income' },
        raw: true
      });

      const actualRow = await Expense.findOne({
        attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total"]],
        where: { user_id: req.userId, year, month: m, type: 'expense' },
        raw: true
      });

      results.push({
        year,
        month: m,
        label: monthNames[m - 1],
        budgeted: parseFloat(incomeRow.total),
        actual: parseFloat(actualRow.total)
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    const expenses = await Expense.findAll({
      where: { user_id: req.userId, year, month, type: 'expense' },
      include: [{ model: Category, attributes: ["name", "color"], required: false }],
      order: [["expense_date", "DESC"]]
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { amount, label, expense_date, category_id } = req.body;
    const date = new Date(expense_date);

    const expense = await Expense.create({
      user_id: req.userId,
      task_id: null,
      category_id: category_id || null,
      amount,
      label,
      expense_date,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      type: 'expense',
      created_at: new Date()
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, label, expense_date, category_id } = req.body;

    const expense = await Expense.findOne({ where: { id, user_id: req.userId, task_id: null } });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const date = new Date(expense_date);
    await expense.update({
      amount,
      label,
      expense_date,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      category_id: category_id || null
    });

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      where: { id, user_id: req.userId }
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await expense.destroy();
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
