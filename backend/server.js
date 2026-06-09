require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const morgan   = require("morgan");

const candidatesRouter = require("./routes/candidates");
const votesRouter      = require("./routes/votes");
const votersRouter     = require("./routes/voters");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("dev"));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/evoting")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err.message));

app.use("/api/candidates", candidatesRouter);
app.use("/api/votes",      votesRouter);
app.use("/api/voters",     votersRouter);

app.get("/api/health", (req, res) => res.json({
  status: "ok", message: "E-Voting API running", timestamp: new Date().toISOString(),
  mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
}));

app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));

app.listen(PORT, () => console.log(`\n🚀 API running on http://localhost:${PORT}\n`));
module.exports = app;
