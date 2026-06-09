import React, { useState } from "react";
import { verifyTransaction } from "../utils/api";
import toast from "react-hot-toast";
import { Search, ShieldCheck, ShieldX, Loader2, Hash, Blocks, Clock, User, FileCode2 } from "lucide-react";

function Verifier() {
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleVerify(e) {
    e.preventDefault();
    const hash = txHash.trim();
    if (!hash || hash.length !== 66 || !hash.startsWith("0x")) {
      return toast.error("Enter a valid tx hash (66 chars, starts with 0x)");
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyTransaction(hash);
      setResult(res);
    } catch (err) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-heading text-2xl font-bold text-gov-navy">Vote Verifier</h2>
        <p className="text-gov-text/60 font-body mt-1">Verify any vote by entering its transaction hash.</p>
      </div>
      <form onSubmit={handleVerify} className="flex gap-3">
        <div className="flex-1 relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-text/40" />
          <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)}
            placeholder="Enter transaction hash (0x...)"
            className="w-full pl-11 pr-4 py-3 bg-white border border-gov-border/50 rounded-xl text-sm font-mono text-gov-navy placeholder:text-gov-text/30 focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue transition-all" />
        </div>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gov-navy hover:bg-gov-blue text-white font-semibold rounded-xl transition-all disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Verify
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl border border-gov-border/50 shadow-sm overflow-hidden">
          <div className={`px-6 py-5 flex items-center gap-3 ${result.verified ? "bg-gov-success/10" : "bg-gov-danger/10"}`}>
            {result.verified ? (
              <><ShieldCheck className="w-8 h-8 text-gov-success" /><div><h3 className="font-heading font-bold text-gov-success text-lg">Vote Verified ✅</h3><p className="text-sm text-gov-success/80">{result.message}</p></div></>
            ) : (
              <><ShieldX className="w-8 h-8 text-gov-danger" /><div><h3 className="font-heading font-bold text-gov-danger text-lg">Verification Failed ❌</h3><p className="text-sm text-gov-danger/80">{result.error}</p></div></>
            )}
          </div>
          {result.verified && result.transaction && (
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Info icon={Hash} label="Tx Hash" value={result.transaction.hash} mono />
                <Info icon={Blocks} label="Block" value={`#${result.transaction.blockNumber}`} />
                <Info icon={User} label="Voter" value={result.transaction.from} mono />
                <Info icon={ShieldCheck} label="Candidate" value={result.candidateName || "N/A"} />
                <Info icon={Clock} label="Time" value={result.transaction.timestamp ? new Date(result.transaction.timestamp).toLocaleString() : "N/A"} />
                <Info icon={FileCode2} label="Gas Used" value={result.transaction.gasUsed || "N/A"} />
              </div>
              {result.voteReceipt && (
                <div className="mt-4 p-4 bg-gov-light rounded-lg">
                  <p className="text-xs font-semibold text-gov-text/60 mb-1">Receipt Hash</p>
                  <p className="text-xs font-mono text-gov-navy break-all">{result.voteReceipt.receiptHash}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value, mono }) {
  return (
    <div className="p-3 bg-gov-light/50 rounded-lg border border-gov-border/20">
      <div className="flex items-center gap-2 mb-1"><Icon className="w-3 h-3 text-gov-blue" /><span className="text-xs text-gov-text/60">{label}</span></div>
      <p className={`text-sm text-gov-navy truncate ${mono ? "font-mono text-xs" : ""}`} title={value}>{value}</p>
    </div>
  );
}

export default Verifier;
