const transactionModel = require("../models/transaction.model");

const ledgerModel = require("../models/ledger.model");

const emailService = require("../services/email.service");

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW
    * 1. Validate request
    * 2. Validate idempotency key
    * 3. Check account status
    * 4. Derive sender balance from ledger
    * 5. Create transaction with status PENDING
    * 6. Create DEBIT ledger entry for sender
    * 7. Create CREDIT ledger entry for receiver
    * 8. Update transaction status to COMPLETED
    * 9. Commit mongoDB session
    * 9. Send notification emails to sender and receiver
 */

async function createTransaction(req, res){
    const {fromAccount, toAccount, amount, idempotencyKey} = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        res.status(400).json({
            message: "Missing required fields: fromAccount, toAccount, amount, idempotencyKey"
        })
    }
}