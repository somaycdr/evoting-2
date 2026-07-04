const mongoose = require("mongoose");
const CandidateSchema = new mongoose.Schema({
  candidateId:          { type: Number, required: true, unique: true, index: true },
  name:                 { type: String, required: true, trim: true },
  party:                { type: String, required: true, trim: true },
  description:          { type: String, default: "" },
  photoUrl:             { type: String, default: "" },
  manifesto:            { type: String, default: "" },
  age:                  { type: Number, default: null },
  constituency:         { type: String, default: "National" },
  isDisqualified:       { type: Boolean, default: false },
  disqualificationReason: { type: String, default: "" },
  disqualifiedAt:       { type: Date, default: null }
}, { timestamps: true });
module.exports = mongoose.model("Candidate", CandidateSchema);
