import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { fetchCandidates, recordVote } from "../utils/api";
import { useWeb3 } from "../context/Web3Context";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contractConfig";
import toast from "react-hot-toast";
import {
  Vote,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Ban,
} from "lucide-react";

function CastVote() {
  const { account, contract, isCorrectNetwork, ensureHardhatNetwork } = useWeb3();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [voting, setVoting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [voterName, setVoterName] = useState("");

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    checkVoteStatus();
    checkAuthorization();
  }, [account, contract]);

  async function loadCandidates() {
    try {
      const res = await fetchCandidates();
      if (res.success) setCandidates(res.data);
    } catch (err) {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  async function checkVoteStatus() {
    if (!account || !contract) return;
    try {
      const voted = await contract.hasVoted(account);
      setHasVoted(voted);
    } catch (err) {
      console.error("Vote status check failed:", err);
    }
  }

  const checkAuthorization = useCallback(async () => {
    if (!account) return;
    try {
      const res = await axios.get(`/api/voters/check/${account}`);
      if (!res.data.isAuthorized) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
        setVoterName(res.data.voter?.name || "");
      }
    } catch (err) {
      setIsAuthorized(false);
    }
  }, [account]);

  async function handleVote() {
    if (!account) return toast.error("Please connect your wallet first");
    if (!isCorrectNetwork) return toast.error("Please switch to Hardhat network (Chain ID 31337)");
    if (!selectedId) return toast.error("Please select a candidate");
    if (hasVoted) return toast.error("You have already voted");

    // Block vote if the selected candidate is disqualified
    const selectedCandidate = candidates.find((c) => c.id === selectedId);
    if (selectedCandidate?.isDisqualified) {
      return toast.error("This candidate has been disqualified and cannot receive votes.");
    }

    setVoting(true);
    try {
      await ensureHardhatNetwork();
      const freshProvider = new ethers.BrowserProvider(window.ethereum, {
        name: "hardhat",
        chainId: 31337,
      });
      const freshSigner = await freshProvider.getSigner();
      const freshContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, freshSigner);

      const tx = await freshContract.castVote(selectedId);
      toast.loading("Transaction submitted. Waiting for confirmation...", { id: "vote" });

      const receipt = await tx.wait();
      toast.dismiss("vote");

      // Resolve candidate name — first try local list, then chain as fallback
      let candidate = candidates.find((c) => c.id === selectedId);
      let resolvedName = candidate?.name || "";
      if (!resolvedName) {
        try {
          const chainCandidate = await freshContract.getCandidate(selectedId);
          resolvedName = chainCandidate[1] || `Candidate #${selectedId}`;
        } catch (e) {
          resolvedName = `Candidate #${selectedId}`;
        }
      }

      try {
        await recordVote({
          txHash: receipt.hash,
          voterAddress: account,
          candidateId: selectedId,
          candidateName: resolvedName,
        });
      } catch (err) {
        console.error("Backend record failed:", err);
      }

      setSuccess({
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        candidateName: resolvedName || `Candidate #${selectedId}`,
      });
      setHasVoted(true);
      toast.success("Vote cast successfully! Check the Audit Log for your record.");
    } catch (err) {
      console.error("Vote failed:", err);
      const msg = err.reason || err.message || "Vote transaction failed";
      toast.error(msg.includes("already cast") ? "You have already voted!" : msg);
    } finally {
      setVoting(false);
    }
  }

  const selectedCandidate = candidates.find((c) => c.id === selectedId);
  const selectedIsDisqualified = selectedCandidate?.isDisqualified === true;

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-white rounded-xl border border-gov-success/30 shadow-lg overflow-hidden">
          <div className="bg-gov-success/10 px-6 py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-gov-success mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-gov-navy mb-2">
              Vote Recorded Successfully!
            </h2>
            <p className="text-gov-text/70 font-body">
              Your vote for <strong>{success.candidateName}</strong> has been
              permanently recorded on the blockchain.
            </p>
          </div>

          <div className="px-6 py-5 space-y-3">
            <DetailRow label="Transaction Hash" value={success.txHash} mono />
            <DetailRow label="Block Number" value={`#${success.blockNumber}`} />
            <DetailRow label="Status" value="✅ Confirmed" />
          </div>

          <div className="px-6 pb-6">
            <p className="text-xs text-gov-text/50 text-center">
              Save your transaction hash to verify your vote later using the Verifier page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gov-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-gov-navy">
          Cast Your Vote
        </h2>
        <p className="text-gov-text/60 font-body mt-1">
          Select a candidate and submit your vote to the blockchain.
        </p>
      </div>

      {!account && (
        <div className="bg-gov-gold/10 border border-gov-gold/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-gov-gold shrink-0" />
          <p className="text-sm text-gov-text">
            Please connect your MetaMask wallet to cast a vote.
          </p>
        </div>
      )}

      {hasVoted && (
        <div className="bg-gov-blue/10 border border-gov-blue/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-gov-blue shrink-0" />
          <p className="text-sm text-gov-text">
            You have already voted in this election. Each address can only vote once.
          </p>
        </div>
      )}

      {account && isAuthorized === false && (
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="bg-white border-2 border-red-200 rounded-lg p-8">
            <div className="text-4xl mb-4">🚫</div>
            <h2 className="font-heading text-xl font-bold text-red-700 mb-2">
              Not Authorized to Vote
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Your wallet address is not registered in the voter list.
              Contact the Election Administrator to get registered.
            </p>
            <div className="bg-gray-100 rounded p-3 text-xs font-mono text-gray-600 break-all">
              {account}
            </div>
          </div>
        </div>
      )}

      {(!account || isAuthorized !== false) && (
        <>
          {/* Candidate Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map((candidate) => {
              const isDisqualified = candidate.isDisqualified === true;
              const isSelected = selectedId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  onClick={() => {
                    if (isDisqualified || hasVoted) return;
                    setSelectedId(candidate.id);
                  }}
                  style={{
                    position: "relative",
                    cursor: isDisqualified ? "not-allowed" : hasVoted ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                  className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                    isDisqualified
                      ? "border-red-200 bg-red-50/60 opacity-60"
                      : isSelected
                      ? "border-gov-gold bg-gov-gold/5 shadow-lg shadow-gov-gold/10"
                      : "border-gov-border/50 bg-white hover:border-gov-blue/50 hover:shadow-md"
                  } ${hasVoted && !isDisqualified ? "opacity-60" : ""}`}
                >
                  {/* Diagonal strikethrough overlay for disqualified */}
                  {isDisqualified && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "inherit",
                        pointerEvents: "none",
                        background:
                          "repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(220,38,38,0.06) 8px, rgba(220,38,38,0.06) 16px)",
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Block all pointer events inside for disqualified */}
                  <div style={{ pointerEvents: isDisqualified ? "none" : "auto" }}>
                    <div className="flex items-start gap-4">
                      {/* Avatar + Disqualified tooltip */}
                      <div style={{ position: "relative", flexShrink: 0 }} className="group">
                        <img
                          src={candidate.photoUrl}
                          alt={candidate.name}
                          className="w-14 h-14 rounded-full bg-gov-light border-2 border-white shadow"
                          style={isDisqualified ? { filter: "grayscale(80%)" } : {}}
                        />

                        {/* Disqualified badge icon on avatar */}
                        {isDisqualified && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: -2,
                              right: -2,
                              background: "#dc2626",
                              borderRadius: "50%",
                              width: 20,
                              height: 20,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "2px solid #fff",
                              zIndex: 2,
                            }}
                          >
                            <Ban style={{ width: 11, height: 11, color: "#fff" }} />
                          </div>
                        )}

                        {/* Hover tooltip "Disqualified" near profile pic */}
                        {isDisqualified && (
                          <div
                            className="candidate-disq-tooltip"
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "calc(100% + 8px)",
                              transform: "translateY(-50%)",
                              background: "#1a1a1a",
                              color: "#fff",
                              padding: "5px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              pointerEvents: "none",
                              zIndex: 50,
                              opacity: 0,
                              transition: "opacity 0.18s ease",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                            }}
                          >
                            🚫 Disqualified
                            {/* Arrow */}
                            <span
                              style={{
                                position: "absolute",
                                right: "100%",
                                top: "50%",
                                transform: "translateY(-50%)",
                                borderWidth: "5px",
                                borderStyle: "solid",
                                borderColor: "transparent #1a1a1a transparent transparent",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-gov-navy text-lg">
                            {candidate.name}
                          </h3>
                          {isDisqualified && (
                            <span
                              style={{
                                background: "#fee2e2",
                                color: "#991b1b",
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: "4px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                              }}
                            >
                              Disqualified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gov-blue font-medium">{candidate.party}</p>
                        <p className="text-xs text-gov-text/60 mt-1 line-clamp-2">
                          {candidate.description}
                        </p>
                        {candidate.constituency && (
                          <p className="text-xs text-gov-text/40 mt-1">
                            📍 {candidate.constituency}
                          </p>
                        )}
                        {isDisqualified && (
                          <p className="text-xs text-red-500 mt-1 font-medium">
                            ⛔ Voting disabled — candidate removed from election
                          </p>
                        )}
                      </div>

                      {isSelected && !isDisqualified && (
                        <CheckCircle2 className="w-6 h-6 text-gov-gold shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Vote */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleVote}
              disabled={!selectedId || voting || !account || hasVoted || selectedIsDisqualified}
              className="flex items-center gap-2 px-8 py-3 bg-gov-navy hover:bg-gov-blue text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-gov-navy/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {voting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Vote className="w-5 h-5" />
              )}
              {voting
                ? "Submitting Vote..."
                : selectedIsDisqualified
                ? "Cannot Vote — Candidate Disqualified"
                : "Submit Vote to Blockchain"}
            </button>
          </div>
        </>
      )}

      {/* Tooltip hover CSS */}
      <style>{`
        .group:hover .candidate-disq-tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gov-border/20 last:border-0">
      <span className="text-xs text-gov-text/60 shrink-0">{label}</span>
      <span
        className={`text-xs text-right text-gov-navy break-all ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default CastVote;
