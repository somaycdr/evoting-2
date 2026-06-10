const express   = require("express");
const router    = express.Router();
const Candidate = require("../models/Candidate");
const { getContract } = require("../utils/blockchain");

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
        photoUrl: dbData?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(chainData[1])}`,
        age: dbData?.age || null, constituency: dbData?.constituency || "National"
      };
    }));
    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
      age: dbData?.age || null, constituency: dbData?.constituency || "National"
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/seed", async (req, res) => {
  try {
    const contract = getContract();
    const ids = await contract.getAllCandidateIds();
    const meta = [
      { age: 42, constituency: "Law",   manifesto: "Digital India, Transparent Governance" },
      { age: 38, constituency: "Pharmacy", manifesto: "Education First, Build Tomorrow", photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=Sneha" },
      { age: 45, constituency: "Management", manifesto: "Jobs, Growth, Prosperity" },
      { age: 36, constituency: "Technology",    manifesto: "Green Future, Sustainable India" },
    ];
    let seeded = 0;
    for (let i = 0; i < ids.length; i++) {
      const id = Number(ids[i]);
      const chainData = await contract.getCandidate(id);
      await Candidate.findOneAndUpdate({ candidateId: id }, {
        candidateId: id, name: chainData[1], party: chainData[2], description: chainData[3],
        ...(meta[i] || {}),
        photoUrl: meta[i]?.photoUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(chainData[1])}`
      }, { upsert: true, new: true });
      seeded++;
    }
    res.json({ success: true, message: `Seeded ${seeded} candidates` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
