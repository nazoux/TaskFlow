const { body, query } = require("express-validator");

const setBudgetValidator = [
  body("year")
    .notEmpty()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("year must be a valid year"),

  body("month")
    .notEmpty()
    .isInt({ min: 1, max: 12 })
    .withMessage("month must be between 1 and 12"),

  body("amount")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("amount must be a positive number"),

  body("label")
    .optional()
    .trim()
];

const addExpenseValidator = [
  body("amount")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("amount must be a positive number"),

  body("label")
    .trim()
    .notEmpty()
    .withMessage("label is required"),

  body("expense_date")
    .notEmpty()
    .isISO8601()
    .withMessage("expense_date must be a valid date"),

  body("category_id")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("category_id must be a positive integer")
];

module.exports = { setBudgetValidator, addExpenseValidator };
