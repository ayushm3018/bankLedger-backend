const mongoose = require("mongoose");       

const transactionSchema = new mongoose.Schema({
    fromAccount :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must have a source account"],
        index: true
    },
    toAccount : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must have a destination/to account"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED"
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "Transaction must have an amount"],
        min: [0.01, "Transaction amount must be at least 0.01"]
        },
        
    idempotencyKey: {
        type: String, 
        required: [true, "Idempotency key is required for creating a transaction"],
        unique: true, // Ensure idempotency key is unique across transactions
        index: true
    },

    //idempotency key is used to ensure that if the same transaction request is sent multiple times (e.g., due to network retries), only one transaction is created. By making it unique and indexed, we can quickly check for existing transactions with the same key. It is always generated on the client side and sent in the request body when creating a transaction. If a transaction with the same idempotency key already exists, the server can return that transaction instead of creating a new one, thus preventing duplicate transactions.

        
    })

const transactionModel = mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;