const express = require("express");
const authController = require("../controllers/auth.controller")

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: User registration, login, and logout
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a user, sets a JWT in an httpOnly cookie, and returns the user with token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:    { type: string, example: alice@example.com }
 *               password: { type: string, minLength: 6, example: secret123 }
 *               name:     { type: string, example: Alice }
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:  { $ref: '#/components/schemas/User' }
 *                 token: { type: string, description: JWT access token }
 *       422:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         description: Too many auth attempts (rate limited)
 */
router.post("/register", authController.userRegisterController);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in an existing user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: alice@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:  { $ref: '#/components/schemas/User' }
 *                 token: { type: string }
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         description: Too many auth attempts (rate limited)
 */
router.post("/login", authController.userLoginController);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current user
 *     description: Blacklists the current JWT and clears the auth cookie.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User logged out successfully }
 */
router.post("/logout", authController.userLogoutController);

module.exports = router
