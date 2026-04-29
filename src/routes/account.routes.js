const express = require("express");
const authMiddleware = require("../middleware/auth.middlware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/**
 * - POST /api/accounts
 * - create a new account
 * - protected route, only authenticated users can create accounts
 */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController);

/**
 * - GET /api/accounts/
 * - Get all accounts for the authenticated user
 * - protected route, only authenticated users can access their accounts
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController);

/**
 * - GET /api/accounts/balance/:accountId
 * - Get the current balance of a specific account
 * - protected route, only authenticated users can access their accounts
 */

router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

module.exports = router;