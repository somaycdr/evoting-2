import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contractConfig";

const Web3Context = createContext(null);

const HARDHAT_CHAIN_ID_HEX = "0x7A69"; // 31337 in hex
const HARDHAT_CHAIN_ID = 31337;

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;

  // Force MetaMask to the correct Hardhat network (chainId 31337)
  const ensureHardhatNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    // Check current chain
    const currentChainHex = await window.ethereum.request({ method: "eth_chainId" });
    const currentChain = parseInt(currentChainHex, 16);

    if (currentChain === HARDHAT_CHAIN_ID) return; // Already on correct network

    try {
      // Try switching first
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      // 4902 = chain not found in MetaMask, need to add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: HARDHAT_CHAIN_ID_HEX,
              chainName: "Hardhat Local (31337)",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["http://127.0.0.1:8545"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      // Step 1: Force correct network BEFORE creating provider
      await ensureHardhatNetwork();

      // Step 2: Create provider with explicit network to avoid caching stale chainId
      const browserProvider = new ethers.BrowserProvider(window.ethereum, {
        name: "hardhat",
        chainId: HARDHAT_CHAIN_ID,
      });

      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      const currentSigner = await browserProvider.getSigner();
      const votingContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, currentSigner);

      setProvider(browserProvider);
      setSigner(currentSigner);
      setContract(votingContract);
      setAccount(accounts[0]);
      setChainId(currentChainId);
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [ensureHardhatNetwork]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setChainId(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  const value = {
    account,
    provider,
    signer,
    contract,
    chainId,
    isConnecting,
    isCorrectNetwork,
    error,
    connectWallet,
    disconnectWallet,
    ensureHardhatNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export default Web3Context;
