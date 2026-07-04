const mongoose = require("mongoose");

async function dropDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect("mongodb://localhost:27017/evoting");
    console.log("Dropping database...");
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully.");
  } catch (err) {
    console.error("Error dropping DB:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  }
}

dropDB();
