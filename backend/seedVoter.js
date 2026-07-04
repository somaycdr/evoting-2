const mongoose = require("mongoose");
const Voter = require("./models/Voter");

async function seed() {
  try {
    await mongoose.connect("mongodb://localhost:27017/evoting");
    const v = new Voter({
      walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      name: "Current User",
      email: "user@ymca.edu",
      studentId: "10001",
      isAuthorized: true
    });
    await v.save();
    console.log("Voter registered successfully.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
seed();
