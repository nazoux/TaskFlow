const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validation.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  registerValidator,
  loginValidator
} = require("../validators/auth.validator");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterSuccess'
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  "/register",
  registerValidator,
  validate,
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */
router.post(
  "/login",
  loginValidator,
  validate,
  authController.login
);

router.get("/me", authMiddleware, authController.getMe);
router.put("/me", authMiddleware, authController.updateMe);
router.post("/me/avatar", authMiddleware, upload.single("avatar"), authController.uploadAvatar);

module.exports = router;