const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  createTaskValidator,
  updateTaskValidator
} = require("../validators/task.validator");

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Récupérer toutes les tâches de l'utilisateur connecté
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tâches récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/", authMiddleware, taskController.getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Récupérer une tâche par ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche
 *     responses:
 *       200:
 *         description: Tâche trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Tâche non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", authMiddleware, taskController.getTaskById);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Créer une tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskInput'
 *     responses:
 *       201:
 *         description: Tâche créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Catégorie non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.post(
  "/",
  authMiddleware,
  createTaskValidator,
  validate,
  taskController.createTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Modifier une tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskInput'
 *     responses:
 *       200:
 *         description: Tâche mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task updated
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Tâche ou catégorie non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.put(
  "/:id",
  authMiddleware,
  updateTaskValidator,
  validate,
  taskController.updateTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Supprimer une tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche
 *     responses:
 *       200:
 *         description: Tâche supprimée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Tâche non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", authMiddleware, taskController.deleteTask);

module.exports = router;