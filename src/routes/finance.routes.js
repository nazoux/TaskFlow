const express = require("express");
const router = express.Router();

const financeController = require("../controllers/finance.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { setBudgetValidator, addExpenseValidator } = require("../validators/finance.validator");

/**
 * @swagger
 * /finance/income:
 *   post:
 *     summary: Définir le budget/salaire d'un mois
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [year, month, amount]
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 2026
 *               month:
 *                 type: integer
 *                 example: 3
 *               amount:
 *                 type: number
 *                 example: 2500.00
 *               label:
 *                 type: string
 *                 example: Salaire
 *     responses:
 *       200:
 *         description: Budget défini avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.post("/income", authMiddleware, setBudgetValidator, validate, financeController.setIncome);

/**
 * @swagger
 * /finance/summary:
 *   get:
 *     summary: Résumé des 6 derniers mois (budget, dépenses, prévision)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           example: 6
 *         description: Nombre de mois à retourner
 *     responses:
 *       200:
 *         description: Résumé récupéré avec succès
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/summary", authMiddleware, financeController.getSummary);

/**
 * @swagger
 * /finance/by-category:
 *   get:
 *     summary: Dépenses groupées par catégorie pour un mois donné
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           example: 3
 *     responses:
 *       200:
 *         description: Dépenses par catégorie récupérées
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/by-category", authMiddleware, financeController.getByCategory);

/**
 * @swagger
 * /finance/history:
 *   get:
 *     summary: Historique annuel des dépenses mois par mois
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/history", authMiddleware, financeController.getHistory);

/**
 * @swagger
 * /finance/expenses:
 *   get:
 *     summary: Récupérer les dépenses d'un mois donné
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           example: 3
 *     responses:
 *       200:
 *         description: Liste des dépenses
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/expenses", authMiddleware, financeController.getExpenses);

/**
 * @swagger
 * /finance/expenses:
 *   post:
 *     summary: Ajouter une dépense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, amount, expense_date]
 *             properties:
 *               label:
 *                 type: string
 *                 example: Courses Lidl
 *               amount:
 *                 type: number
 *                 example: 45.50
 *               expense_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-13
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *     responses:
 *       201:
 *         description: Dépense ajoutée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.post("/expenses", authMiddleware, addExpenseValidator, validate, financeController.addExpense);

/**
 * @swagger
 * /finance/expenses/{id}:
 *   put:
 *     summary: Modifier une dépense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la dépense
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: Courses Carrefour
 *               amount:
 *                 type: number
 *                 example: 60.00
 *               expense_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-14
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *     responses:
 *       200:
 *         description: Dépense modifiée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Dépense non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.put("/expenses/:id", authMiddleware, addExpenseValidator, validate, financeController.updateExpense);

/**
 * @swagger
 * /finance/expenses/{id}:
 *   delete:
 *     summary: Supprimer une dépense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la dépense
 *     responses:
 *       200:
 *         description: Dépense supprimée avec succès
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Dépense non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete("/expenses/:id", authMiddleware, financeController.deleteExpense);

module.exports = router;
