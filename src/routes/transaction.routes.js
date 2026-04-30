const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middlware")
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * @openapi
 * tags:
 *   - name: Transactions
 *     description: Money transfers between accounts (atomic + idempotent)
 */

/**
 * @openapi
 * /api/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Transfer money between two accounts
 *     description: |
 *       Performs a transfer using a MongoDB transaction so that the DEBIT and CREDIT
 *       ledger entries are atomic. The `idempotencyKey` lets clients safely retry on
 *       network failures without double-spending.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromAccount, toAccount, amount, idempotencyKey]
 *             properties:
 *               fromAccount:    { type: string, example: 65f1c2e0a1b2c3d4e5f60010 }
 *               toAccount:      { type: string, example: 65f1c2e0a1b2c3d4e5f60011 }
 *               amount:         { type: number, example: 500 }
 *               idempotencyKey: { type: string, example: txn-2026-04-30-001 }
 *     responses:
 *       201:
 *         description: Transaction completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:     { type: string }
 *                 transaction: { $ref: '#/components/schemas/Transaction' }
 *       200:
 *         description: Idempotent replay (transaction already processed or in-flight)
 *       400:
 *         description: Missing fields, inactive account, or insufficient balance
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: fromAccount or toAccount not found
 *       500:
 *         description: Transaction failed and was rolled back; safe to retry
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * @openapi
 * /api/transactions/system/initial-funds:
 *   post:
 *     tags: [Transactions]
 *     summary: Seed an account with initial funds (system user only)
 *     description: |
 *       Restricted endpoint used to credit an account from the system account.
 *       Requires the caller to be a system user. Useful for seeding test data.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toAccount, amount, idempotencyKey]
 *             properties:
 *               toAccount:      { type: string }
 *               amount:         { type: number, example: 10000 }
 *               idempotencyKey: { type: string, example: seed-2026-04-30-001 }
 *     responses:
 *       201:
 *         description: Initial funds credited
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:     { type: string }
 *                 transaction: { $ref: '#/components/schemas/Transaction' }
 *       400:
 *         description: Missing fields or destination account not active
 *       403:
 *         description: Caller is not a system user
 *       404:
 *         description: Destination account not found
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;
