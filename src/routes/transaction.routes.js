const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middlware")
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - POST /api/transactions
 * - Create a new transaction
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction) 
/**
 * - POST /api/transactions/system/intial-funds
 * - Create intial funds transaction from system account to a user account (used for testing and seeding data)
 */

transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;