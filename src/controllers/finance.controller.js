const sequelize = require("../config/database");
const { Op } = require("sequelize");
const { Expense, Task, Category } = require("../models");

// Helper : calcule le total des dépenses d'un mois en incluant les récurrentes actives
async function getActualForMonth(userId, year, month) {
  // Dépenses normales du mois
  const normalRow = await Expense.findOne({
    attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total"]],
    where: { user_id: userId, year, month, type: 'expense', is_recurring: false },
    raw: true
  });

  // Récurrentes actives ce mois (source unique : la ligne récurrente couvre ce mois si start <= mois <= end ou pas de end)
  const recurringRows = await Expense.findAll({
    attributes: ["amount"],
    where: {
      user_id: userId,
      type: 'expense',
      is_recurring: true,
      [Op.and]: [
        sequelize.literal(`(recurring_start_year < ${year} OR (recurring_start_year = ${year} AND recurring_start_month <= ${month}))`),
        sequelize.literal(`(recurring_end_year IS NULL OR recurring_end_year > ${year} OR (recurring_end_year = ${year} AND recurring_end_month >= ${month}))`)
      ]
    },
    raw: true
  });

  const recurringTotal = recurringRows.reduce((acc, r) => acc + parseFloat(r.amount), 0);
  return parseFloat(normalRow.total) + recurringTotal;
}

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
    const refYear = parseInt(req.query.year) || now.getFullYear();
    const refMonth = parseInt(req.query.month) || (now.getMonth() + 1);
    const results = [];
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(refYear, refMonth - 1 - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const incomeRow = await Expense.findOne({
        attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total"]],
        where: { user_id: req.userId, year, month, type: 'income' },
        raw: true
      });

      const actual = await getActualForMonth(req.userId, year, month);

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

    // Dépenses normales groupées par catégorie
    const rows = await Expense.findAll({
      attributes: [
        "category_id",
        [sequelize.fn("SUM", sequelize.col("Expense.amount")), "total"]
      ],
      where: { user_id: req.userId, year, month, type: 'expense', is_recurring: false },
      include: [{ model: Category, attributes: ["name", "color"], required: false }],
      group: ["category_id", "Category.id"],
      raw: true,
      nest: true
    });

    // Récurrentes actives ce mois
    const recurringRows = await Expense.findAll({
      where: {
        user_id: req.userId,
        type: 'expense',
        is_recurring: true,
        [Op.and]: [
          sequelize.literal(`(recurring_start_year < ${year} OR (recurring_start_year = ${year} AND recurring_start_month <= ${month}))`),
          sequelize.literal(`(recurring_end_year IS NULL OR recurring_end_year > ${year} OR (recurring_end_year = ${year} AND recurring_end_month >= ${month}))`)
        ]
      },
      include: [{ model: Category, attributes: ["name", "color"], required: false }]
    });

    // Fusionner
    const map = {};
    rows.forEach(r => {
      const key = r.category_id || 'none';
      map[key] = {
        categoryId: r.category_id,
        categoryName: r.Category ? r.Category.name : "Uncategorized",
        categoryColor: r.Category ? r.Category.color : "#cbd5e1",
        total: parseFloat(r.total)
      };
    });
    recurringRows.forEach(r => {
      const key = r.category_id || 'none';
      if (map[key]) {
        map[key].total += parseFloat(r.amount);
      } else {
        map[key] = {
          categoryId: r.category_id,
          categoryName: r.Category ? r.Category.name : "Uncategorized",
          categoryColor: r.Category ? r.Category.color : "#cbd5e1",
          total: parseFloat(r.amount)
        };
      }
    });

    res.json(Object.values(map));
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

      const actual = await getActualForMonth(req.userId, year, m);
      const budgeted = parseFloat(incomeRow.total);

      results.push({
        year,
        month: m,
        label: monthNames[m - 1],
        budgeted,
        actual
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

    // Dépenses normales du mois
    const normal = await Expense.findAll({
      where: { user_id: req.userId, year, month, type: 'expense', is_recurring: false },
      include: [{ model: Category, attributes: ["name", "color"], required: false }],
      order: [["expense_date", "DESC"]]
    });

    // Récurrentes actives ce mois (ligne source)
    const recurring = await Expense.findAll({
      where: {
        user_id: req.userId,
        type: 'expense',
        is_recurring: true,
        [Op.and]: [
          sequelize.literal(`(recurring_start_year < ${year} OR (recurring_start_year = ${year} AND recurring_start_month <= ${month}))`),
          sequelize.literal(`(recurring_end_year IS NULL OR recurring_end_year > ${year} OR (recurring_end_year = ${year} AND recurring_end_month >= ${month}))`)
        ]
      },
      include: [{ model: Category, attributes: ["name", "color"], required: false }],
      order: [["expense_date", "DESC"]]
    });

    // Pour les récurrentes, adapter la date d'affichage au mois courant
    const recurringMapped = recurring.map(exp => {
      const day = new Date(exp.expense_date).getDate();
      const displayDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { ...exp.toJSON(), expense_date: displayDate };
    });

    res.json([...recurringMapped, ...normal]);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { amount, label, expense_date, category_id, is_recurring } = req.body;
    const date = new Date(expense_date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const expense = await Expense.create({
      user_id: req.userId,
      task_id: null,
      category_id: category_id || null,
      amount,
      label,
      expense_date,
      year,
      month,
      type: 'expense',
      is_recurring: is_recurring || false,
      recurring_start_year: is_recurring ? year : null,
      recurring_start_month: is_recurring ? month : null,
      recurring_end_year: null,
      recurring_end_month: null,
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
    const { amount, label, expense_date, category_id, is_recurring } = req.body;

    const expense = await Expense.findOne({ where: { id, user_id: req.userId, task_id: null } });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const date = new Date(expense_date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    await expense.update({
      amount,
      label,
      expense_date,
      year,
      month,
      category_id: category_id || null,
      is_recurring: is_recurring || false,
      recurring_start_year: is_recurring ? (expense.recurring_start_year || year) : null,
      recurring_start_month: is_recurring ? (expense.recurring_start_month || month) : null,
      recurring_end_year: is_recurring ? expense.recurring_end_year : null,
      recurring_end_month: is_recurring ? expense.recurring_end_month : null,
    });

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;

    const expense = await Expense.findOne({ where: { id, user_id: req.userId } });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (expense.is_recurring && year && month) {
      // Stopper la récurrente à la fin du mois précédent
      const y = parseInt(year);
      const m = parseInt(month);
      const endMonth = m === 1 ? 12 : m - 1;
      const endYear = m === 1 ? y - 1 : y;

      // Si on stoppe avant ou au mois de début → supprimer complètement
      const startsBefore = expense.recurring_start_year < endYear ||
        (expense.recurring_start_year === endYear && expense.recurring_start_month <= endMonth);

      if (startsBefore) {
        await expense.update({ recurring_end_year: endYear, recurring_end_month: endMonth });
      } else {
        await expense.destroy();
      }
    } else {
      await expense.destroy();
    }

    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
