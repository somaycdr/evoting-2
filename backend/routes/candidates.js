const express   = require("express");
const router    = express.Router();
const Candidate = require("../models/Candidate");
const { getContract } = require("../utils/blockchain");

// GET /api/candidates – list all candidates (merged from chain + DB)
router.get("/", async (req, res) => {
  try {
    const dbCandidates = await Candidate.find().sort({ candidateId: 1 });
    const contract = getContract();
    const candidateIds = await contract.getAllCandidateIds();
    const merged = await Promise.all(candidateIds.map(async (id) => {
      const chainData = await contract.getCandidate(id);
      const dbData = dbCandidates.find(c => c.candidateId === Number(id));
      return {
        id: Number(chainData[0]), name: chainData[1], party: chainData[2],
        description: chainData[3], voteCount: Number(chainData[4]),
        photoUrl: dbData?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(chainData[1])}&backgroundColor=c0aede,b6e3f4,d1d4f9,ffd5dc,ffdfbf`,
        age: dbData?.age || null, constituency: dbData?.constituency || "National",
        isDisqualified: dbData?.isDisqualified || false,
        disqualificationReason: dbData?.disqualificationReason || "",
        disqualifiedAt: dbData?.disqualifiedAt || null
      };
    }));
    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/candidates/:id – single candidate
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid ID" });
    const contract = getContract();
    const chainData = await contract.getCandidate(id);
    const dbData = await Candidate.findOne({ candidateId: id });
    res.json({ success: true, data: {
      id: Number(chainData[0]), name: chainData[1], party: chainData[2],
      description: chainData[3], voteCount: Number(chainData[4]),
      photoUrl: dbData?.photoUrl || "", manifesto: dbData?.manifesto || "",
      age: dbData?.age || null, constituency: dbData?.constituency || "National",
      isDisqualified: dbData?.isDisqualified || false,
      disqualificationReason: dbData?.disqualificationReason || "",
      disqualifiedAt: dbData?.disqualifiedAt || null
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/candidates – add a new candidate (writes to blockchain + saves metadata)
router.post("/", async (req, res) => {
  try {
    const { name, party, description, photoUrl, constituency, age } = req.body;
    if (!name || !party) {
      return res.status(400).json({ success: false, error: "name and party are required." });
    }

    // Write to blockchain (requires ADMIN_PRIVATE_KEY in .env)
    const signedContract = getContract(true);
    const tx = await signedContract.addCandidate(
      name.trim(),
      party.trim(),
      description?.trim() || ""
    );
    await tx.wait();

    // Determine the new candidateId (last in list)
    const contract = getContract();
    const ids = await contract.getAllCandidateIds();
    const newId = Number(ids[ids.length - 1]);

    // Save extended metadata to MongoDB
    const candidate = await Candidate.findOneAndUpdate(
      { candidateId: newId },
      {
        candidateId: newId,
        name: name.trim(),
        party: party.trim(),
        description: description?.trim() || "",
        photoUrl: photoUrl?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=c0aede`,
        constituency: constituency?.trim() || "General",
        age: age ? Number(age) : null,
        isDisqualified: false,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Candidate added successfully.", data: { candidateId: newId, ...candidate.toObject() } });
  } catch (err) {
    // Provide a friendlier message if private key is missing
    if (err.message.includes("ADMIN_PRIVATE_KEY")) {
      return res.status(500).json({ success: false, error: "Server not configured for write transactions. Add ADMIN_PRIVATE_KEY to backend .env." });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/candidates/:id – disqualify a candidate (immutable blockchain; mark in DB only)
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid ID" });

    const { reason } = req.body;

    // Verify candidate exists on chain
    const contract = getContract();
    const chainData = await contract.getCandidate(id);
    if (!chainData || !chainData[1]) {
      return res.status(404).json({ success: false, error: "Candidate not found on blockchain." });
    }

    // Mark as disqualified in MongoDB
    const updated = await Candidate.findOneAndUpdate(
      { candidateId: id },
      {
        isDisqualified: true,
        disqualificationReason: reason?.trim() || "Violation of election guidelines",
        disqualifiedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `Candidate #${id} has been disqualified.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/candidates/:id/restore – restore a disqualified candidate
router.patch("/:id/restore", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid ID" });

    const updated = await Candidate.findOneAndUpdate(
      { candidateId: id },
      { isDisqualified: false, disqualificationReason: "", disqualifiedAt: null },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: "Candidate record not found in DB." });

    res.json({ success: true, message: `Candidate #${id} restored.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/candidates/seed – seed metadata from blockchain
router.post("/seed", async (req, res) => {
  try {
    const contract = getContract();
    const ids = await contract.getAllCandidateIds();
    const meta = [
      { age: 42, constituency: "Technology",   manifesto: "Digital India, Transparent Governance", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun%20Sharma&backgroundColor=c0aede" },
      { age: 38, constituency: "Management", manifesto: "Education First, Build Tomorrow", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya%20Nair&backgroundColor=ffdfbf" },
      { age: 45, constituency: "Law", manifesto: "Jobs, Growth, Prosperity", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan%20Mehta&backgroundColor=b6e3f4" },
      { age: 36, constituency: "Pharmacy",    manifesto: "Green Future, Sustainable India", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya%20Nair&backgroundColor=d1d4f9" },
    ];
    let seeded = 0;
    for (let i = 0; i < ids.length; i++) {
      const id = Number(ids[i]);
      const chainData = await contract.getCandidate(id);
      await Candidate.findOneAndUpdate({ candidateId: id }, {
        candidateId: id, name: chainData[1], party: chainData[2], description: chainData[3],
        ...(meta[i] || {}),
        photoUrl: meta[i]?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(chainData[1])}&backgroundColor=ffd5dc`
      }, { upsert: true, new: true });
      seeded++;
    }
    res.json({ success: true, message: `Seeded ${seeded} candidates` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
