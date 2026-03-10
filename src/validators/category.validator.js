const { body } = require("express-validator");

const createCategoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must contain at least 2 characters"),

  body("color")
    .optional({ nullable: true, checkFalsy: true })
    .isHexColor()
    .withMessage("Invalid color format")
];

const updateCategoryValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2 })
    .withMessage("Name must contain at least 2 characters"),

  body("color")
    .optional({ nullable: true, checkFalsy: true })
    .isHexColor()
    .withMessage("Invalid color format")
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator
};