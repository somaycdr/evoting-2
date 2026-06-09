const express = require("express");
const router  = express.Router();
const Voter   = require("../models/Voter");

// POST /api/voters/register
// Admin calls this to register a voter's wallet address
router.post("/register", async (req, res) => {
  try {
    const { walletAddress, name, email, studentId } = req.body;

    if (!walletAddress || !name)
      return res.status(400).json({ success: false, error: "walletAddress and name are required" });

    // Check if already registered
    const existing = await Voter.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existing)
      return res.json({ success: false, error: "This wallet is already registered" });

    const voter = new Voter({ walletAddress, name, email, studentId });
    await voter.save();

    res.json({ success: true, message: "Voter registered successfully", data: voter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/voters/check/:address
// Frontend calls this to check if current MetaMask wallet is authorized
router.get("/check/:address", async (req, res) => {
  try {
    const voter = await Voter.findOne({
      walletAddress: req.params.address.toLowerCase(),
      isAuthorized: true
    });

    res.json({
      success: true,
      isAuthorized: !!voter,
      voter: voter || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/voters
// Admin: list all registered voters
router.get("/", async (req, res) => {
  try {
    const voters = await Voter.find().sort({ createdAt: -1 });
    res.json({ success: true, data: voters, total: voters.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/voters/:address
// Admin: revoke a voter's authorization
router.delete("/:address", async (req, res) => {
  try {
    await Voter.findOneAndDelete({ walletAddress: req.params.address.toLowerCase() });
    res.json({ success: true, message: "Voter permanently deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
