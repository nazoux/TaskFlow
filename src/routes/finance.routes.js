const express = require("express");
const router = express.Router();

const financeController = require("../controllers/finance.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { setBudgetValidator, addExpenseValidator } = require("../validators/finance.validator");

router.post("/income", authMiddleware, setBudgetValidator, validate, financeController.setIncome);

router.get("/summary", authMiddleware, financeController.getSummary);
router.get("/by-category", authMiddleware, financeController.getByCategory);
router.get("/history", authMiddleware, financeController.getHistory);

router.get("/expenses", authMiddleware, financeController.getExpenses);
router.post("/expenses", authMiddleware, addExpenseValidator, validate, financeController.addExpense);
router.put("/expenses/:id", authMiddleware, addExpenseValidator, validate, financeController.updateExpense);
router.delete("/expenses/:id", authMiddleware, financeController.deleteExpense);

module.exports = router;
