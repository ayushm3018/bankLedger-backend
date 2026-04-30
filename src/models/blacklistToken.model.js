const mongoose = require("mongoose");

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to blacklist a token"],
        unique: [true, "Token already blacklisted"],
        index: true
    },
    blacklistedAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, { timestamps: true });

blacklistTokenSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 48 // TTL: auto-delete after 48 hours
});

const blacklistTokenModel = mongoose.model("blacklistToken", blacklistTokenSchema);

module.exports = blacklistTokenModel;