const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  createCategoryValidator,
  updateCategoryValidator
} = require("../validators/category.validator");

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Récupérer toutes les catégories de l'utilisateur connecté
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des catégories récupérée avec succès
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/", authMiddleware, categoryController.getCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Récupérer une catégorie par ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Catégorie non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", authMiddleware, categoryController.getCategoryById);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Créer une catégorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       409:
 *         description: Catégorie déjà existante
 *       500:
 *         description: Erreur serveur
 */
router.post(
  "/",
  authMiddleware,
  createCategoryValidator,
  validate,
  categoryController.createCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Modifier une catégorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryInput'
 *     responses:
 *       200:
 *         description: Catégorie mise à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Catégorie non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.put(
  "/:id",
  authMiddleware,
  updateCategoryValidator,
  validate,
  categoryController.updateCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Supprimer une catégorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie supprimée
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Catégorie non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", authMiddleware, categoryController.deleteCategory);

module.exports = router;