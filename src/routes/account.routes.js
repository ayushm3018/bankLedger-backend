const express = require("express");
const authMiddleware = require("../middleware/auth.middlware").authMiddleware;
const accountController = require("../controllers/account.controller").createAccountController;

const router = express.Router();

/**
 * - POST/api/accounts
 * - create a new account 
 * - proteced route, only authenticated users can create accounts
 */

router.post("/", authMiddleware,accountController)

module.exports = router;