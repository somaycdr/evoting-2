const { ethers } = require("ethers");
const path = require("path");
const fs   = require("fs");

let provider = null;
let contract = null;

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
    console.log("🔗 Blockchain provider connected");
  }
  return provider;
}

function getSigner() {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("ADMIN_PRIVATE_KEY not set in .env — needed to send transactions.");
  }
  return new ethers.Wallet(privateKey, getProvider());
}

function getContract(useSigner = false) {
  const configPath = path.join(__dirname, "../contractConfig.json");
  if (!fs.existsSync(configPath)) throw new Error("contractConfig.json not found. Run deploy.js first.");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  if (useSigner) {
    // Always create a fresh signed instance (no caching – signer is stateless)
    return new ethers.Contract(config.CONTRACT_ADDRESS, config.ABI, getSigner());
  }

  if (!contract) {
    contract = new ethers.Contract(config.CONTRACT_ADDRESS, config.ABI, getProvider());
    console.log(`📄 Contract loaded at: ${config.CONTRACT_ADDRESS}`);
  }
  return contract;
}

module.exports = { getProvider, getSigner, getContract };
