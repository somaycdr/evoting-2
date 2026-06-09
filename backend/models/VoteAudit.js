const mongoose = require("mongoose");
const VoteAuditSchema = new mongoose.Schema({
  txHash:        { type: String, required: true, unique: true, index: true, lowercase: true },
  voterAddress:  { type: String, required: true, lowercase: true },
  candidateId:   { type: Number, required: true },
  candidateName: { type: String, default: "" },
  blockNumber:   { type: Number, default: null },
  blockHash:     { type: String, default: "" },
  receiptHash:   { type: String, default: "" },
  gasUsed:       { type: String, default: "" },
  status:        { type: String, enum: ["confirmed","pending","failed"], default: "confirmed" }
}, { timestamps: true });
module.exports = mongoose.model("VoteAudit", VoteAuditSchema);
