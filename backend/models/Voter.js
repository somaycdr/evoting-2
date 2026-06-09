const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
  // The voter's Ethereum wallet address (this is their unique identity)
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,   // always store as lowercase for easy comparison
    trim: true
  },
  // Off-chain identity details (stored in MongoDB, not on blockchain)
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: ""
  },
  studentId: {
    type: String,
    default: ""        // e.g., university roll number
  },
  isAuthorized: {
    type: Boolean,
    default: true      // Admin can revoke access by setting this false
  }
}, { timestamps: true });

module.exports = mongoose.model("Voter", VoterSchema);
