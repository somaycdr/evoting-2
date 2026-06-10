const express = require("express");
const router = express.Router();
const { getContract, getProvider } = require("../utils/blockchain");

// POST /api/election/stop
// Admin: Stop the election manually
router.post("/stop", async (req, res) => {
  try {
    const provider = getProvider();
    const signer = await provider.getSigner(0); // Admin wallet (deployer)
    const contract = getContract().connect(signer);
    
    // Check if active first to return a clearer error message
    const stats = await contract.getElectionStats();
    if (!stats[1]) {
      return res.status(400).json({ success: false, error: "Election is already stopped." });
    }

    const tx = await contract.endElection();
    await tx.wait();
    
    res.json({ success: true, message: "Election has been successfully stopped." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
