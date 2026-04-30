const transactionModel = require("../models/transaction.model");

const ledgerModel = require("../models/ledger.model");

const emailService = require("../services/email.service");

const accountModel = require("../models/account.model");

const mongoose = require("mongoose");
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
    * (5-8 should be done in a mongoDB transaction to ensure atomicity and consistency. If any step fails, the entire transaction should be rolled back to maintain data integrity.)
    * 9. Commit mongoDB session
    * 10. Send notification emails to sender and receiver
 */

async function createTransaction(req, res){

    /**
     * 1. Validate request
     */

    const {fromAccount, toAccount, amount, idempotencyKey} = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
      return res.status(400).json({
            message: "Missing required fields: fromAccount, toAccount, amount, idempotencyKey"
        })
    }
    
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })
    
    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({
            message: "Invalid fromAccount or toAccount"
        })
    }


    /**
     * 2. Validate idempotency key
     */

    const isTransactionAlreadyExisting = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionAlreadyExisting){
        if(isTransactionAlreadyExisting.status === "COMPLETED"){
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExisting
            })
        } if(isTransactionAlreadyExisting.status === "FAILED"){
            return res.status(500).json({
                message: "Transaction failed, you can retry the transaction",
                transaction: isTransactionAlreadyExisting
            })
        }
        if(isTransactionAlreadyExisting.status === "PENDING"){
            return res.status(200).json({
                message: "Transaction with this idempotency key is already being processed/transaction status is pending"
            })
        }

        if(isTransactionAlreadyExisting.status === "REVERSED"){
            return res.status(200).json({
                message: "Transaction was reversed, you can retry the transaction"
            })
        }
    }

    /**
     * 3. Check account status
     */

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message : "Both  fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance();

    if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance in fromAccount. Current balance is ${balance}, required balance is ${amount}`
        })
    }

    /**
     * 5. Create transaction with status PENDING
     */

    let transaction;
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        transaction = (await transactionModel.create([{
            fromAccount, toAccount, amount, idempotencyKey, status: "PENDING"
        }], { session }))[0];

        await ledgerModel.create([{
            account: fromAccount,
            amount,
            type: "DEBIT",
            transaction: transaction._id
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount,
            type: "CREDIT",
            transaction: transaction._id
        }], { session });

        await transactionModel.findByIdAndUpdate(
            transaction._id,
            { status: "COMPLETED" },
            { session }
        );

        await session.commitTransaction();
        session.endSession();
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        if (transaction) {
            await transactionModel.findByIdAndUpdate(
                transaction._id,
                { status: "FAILED" }
            );
        }
        return res.status(500).json({
            message: "Transaction failed, you can retry the transaction after sometime",
            transaction: transaction
        });
    }
 /**
  * 10. Send notification emails to sender and receiver
  */

 await emailService.sendTransactionAlertEmail(req.user.email, req.user.name, amount, toUserAccount._id)

 res.status(201).json({
    message: "Transaction successful",
    transaction: transaction
 })

}

async function createInitialFundsTransaction(req, res){
    const {toAccount, amount, idempotencyKey} = req.body;

    if(!toAccount || !amount || !idempotencyKey){
      return res.status(400).json({
            message: "Missing required fields: toAccount, amount, idempotencyKey, all are required"
        })
    }
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if(!toUserAccount){
        return res.status(404).json({
            message: "Invalid toAccount"
        })
    }

    if(toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message : "toAccount must be ACTIVE to process transaction"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if(!fromUserAccount){
        return res.status(404).json({
            message: "System account not found for user"
        })
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [transaction] = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Transaction successful",
            transaction: transaction
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

module.exports = {
    createTransaction, createInitialFundsTransaction
}
