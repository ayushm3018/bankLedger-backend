const mongoose = require("mongoose");
const { expires } = require("mongoose/lib/utils");

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
        imMutable: true
    }
}, {timestamps: true})

tokenBlacklistSchema.index({createdAt: 1}, {
    expires: 60 * 60 * 48 // Set the TTL to 48 hours (in seconds)
})  //indexing the token field to optimize search queries when checking if a token is blacklisted. This allows for faster lookups and improved performance when validating tokens against the blacklist.            

const blacklistTokenModel = mongoose.model("blacklistToken", blacklistTokenSchema);

module.exports = blacklistTokenModel;