const mongoose = require("mongoose");


const ledgerSchema = new mongoose.Schema({
    account : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Ledger entry must be associated with an account"],
        index: true,
        immutable: true //as ledger entry should not be changed once created, we can set it as immutable to prevent accidental updates to the account reference after the ledger entry is created. This ensures data integrity and consistency in the ledger, and acts as a single source of truth for all transactions related to that account.
    },
    
    amount : {
        type: Number, 
        required: [true, "Ledger entry must have an amount"],
        immutable: true

    },

    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Ledger entry must be associated with a transaction"],
        index: true,
        immutable: true
    },

    type: {
        type: String, 
        enum: {
            values: ["DEBIT", "CREDIT"],
            message: "Ledger entry type can be either DEBIT or CREDIT"
        },
        required: [true, "Ledger entry must have a type"],
        immutable: true
                
    },
    timestamps: true
})

function preventLedgerModification(){
throw new Error("Ledger entries cannot be modified once created");
}

ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("update", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);

const ledgerModel = mongoose.model("ledger", ledgerSchema);

module.exports = ledgerModel











