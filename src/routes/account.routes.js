const express = require("express");
const authMiddleware = require("../middleware/auth.middlware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Accounts
 *     description: Bank accounts owned by authenticated users
 */

/**
 * @openapi
 * /api/accounts:
 *   post:
 *     tags: [Accounts]
 *     summary: Create a new account for the authenticated user
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account: { $ref: '#/components/schemas/Account' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController);

/**
 * @openapi
 * /api/accounts:
 *   get:
 *     tags: [Accounts]
 *     summary: List all accounts owned by the authenticated user
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accounts:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Account' }
 *       401:
 *         description: Not authenticated
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController);

/**
 * @openapi
 * /api/accounts/balance/{accountId}:
 *   get:
 *     tags: [Accounts]
 *     summary: Get the current balance of an account
 *     description: Balance is derived live from the ledger (sum of credits minus sum of debits).
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the account
 *     responses:
 *       200:
 *         description: Current balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accountId: { type: string }
 *                 balance:   { type: number, example: 1500 }
 *       404:
 *         description: Account not found for this user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

module.exports = router;
