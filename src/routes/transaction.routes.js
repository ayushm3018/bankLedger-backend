const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middlware")
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - POST /api/transactions
 * - Create a new transaction
 */

transactionRoutes.post("/", authMiddleware.authMiddleware )

module.exports = transactionRoutes;