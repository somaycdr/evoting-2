const express  = require("express");
const router   = express.Router();
const VoteAudit = require("../models/VoteAudit");
const { getContract, getProvider } = require("../utils/blockchain");

router.post("/record", async (req, res) => {
  try {
    const { txHash, voterAddress, candidateId, candidateName } = req.body;
    if (!txHash || !voterAddress || candidateId === undefined)
      return res.status(400).json({ success: false, error: "Missing fields" });
    const normalizedHash = txHash.toLowerCase();
    const existing = await VoteAudit.findOne({ txHash: normalizedHash });
    if (existing) return res.json({ success: true, message: "Already recorded", data: existing });
    const provider = getProvider();
    const txReceipt = await provider.getTransactionReceipt(normalizedHash);
    const audit = new VoteAudit({
      txHash: normalizedHash, voterAddress: voterAddress.toLowerCase(),
      candidateId: parseInt(candidateId), candidateName: candidateName || "",
      blockNumber: txReceipt?.blockNumber || null, blockHash: txReceipt?.blockHash || "",
      gasUsed: txReceipt?.gasUsed?.toString() || "",
      status: txReceipt?.status === 1 ? "confirmed" : "failed"
    });
    await audit.save();
    res.json({ success: true, message: "Recorded", data: audit });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/verify/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    if (!txHash || txHash.length !== 66)
      return res.status(400).json({ success: false, error: "Invalid hash format" });
    const provider = getProvider();
    const contract  = getContract();
    const [tx, txReceipt] = await Promise.all([
      provider.getTransaction(txHash), provider.getTransactionReceipt(txHash)
    ]);
    if (!tx || !txReceipt) return res.json({ success: false, verified: false, error: "Not found on blockchain" });
    const contractAddress = (await contract.getAddress()).toLowerCase();
    if (tx.to?.toLowerCase() !== contractAddress)
      return res.json({ success: false, verified: false, error: "Not a vote on this contract" });
    if (txReceipt.status !== 1)
      return res.json({ success: false, verified: false, error: "Transaction failed" });
    let receiptData = null, candidateName = null;
    try {
      const receipt = await contract.getMyReceipt(tx.from);
      receiptData = { voter: receipt[0], candidateId: Number(receipt[1]), timestamp: Number(receipt[2]), blockNumber: Number(receipt[3]), receiptHash: receipt[4] };
      const candidate = await contract.getCandidate(receipt[1]);
      candidateName = candidate[1];
    } catch(e) {}
    const block = await provider.getBlock(txReceipt.blockNumber);
    res.json({
      success: true, verified: true,
      transaction: { hash: txReceipt.hash, blockNumber: txReceipt.blockNumber, blockHash: txReceipt.blockHash,
        from: tx.from, to: tx.to, gasUsed: txReceipt.gasUsed?.toString(), status: "Success",
        timestamp: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : null },
      voteReceipt: receiptData, candidateName, contractAddress,
      message: "✅ Vote verified on Ethereum Blockchain"
    });
  } catch (err) { res.status(500).json({ success: false, verified: false, error: err.message }); }
});

router.get("/stats", async (req, res) => {
  try {
    const contract = getContract();
    const stats = await contract.getElectionStats();
    res.json({ success: true, data: {
      electionName: stats[0], isActive: stats[1], endTime: Number(stats[2]),
      totalCandidates: Number(stats[3]), totalVotes: Number(stats[4])
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/audit", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      VoteAudit.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      VoteAudit.countDocuments()
    ]);
    res.json({ success: true, data: records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
