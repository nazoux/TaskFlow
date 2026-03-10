const { body } = require("express-validator");
const { TASK_STATUSES, TASK_PRIORITIES } = require("../utils/task-values");

const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(TASK_STATUSES)
    .withMessage("Invalid status"),

  body("priority")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(TASK_PRIORITIES)
    .withMessage("Invalid priority"),

  body("due_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid due_date format"),

  body("category_id")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("category_id must be a positive integer")
];

const updateTaskValidator = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),

  body("status")
    .optional()
    .isIn(TASK_STATUSES)
    .withMessage("Invalid status"),

  body("priority")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(TASK_PRIORITIES)
    .withMessage("Invalid priority"),

  body("due_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid due_date format"),

  body("category_id")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === "") {
        return true;
      }

      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw new Error("category_id must be a positive integer");
      }

      return true;
    })
];

module.exports = {
  createTaskValidator,
  updateTaskValidator
};