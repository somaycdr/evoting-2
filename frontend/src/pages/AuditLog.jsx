import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchAuditLog } from "../utils/api";
import { FileText, ChevronLeft, ChevronRight, Loader2, ExternalLink, Copy, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useWeb3 } from "../context/Web3Context";

function AuditLog() {
  const { chainId } = useWeb3();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newIds, setNewIds] = useState(new Set());
  const knownIdsRef = useRef(new Set());
  const pollIntervalRef = useRef(null);
  const currentPageRef = useRef(1);

  const loadAudit = useCallback(async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetchAuditLog(page);
      if (res.success) {
        // Detect newly-added records
        const freshNewIds = new Set();
        res.data.forEach((r) => {
          const id = r._id;
          if (!knownIdsRef.current.has(id)) {
            freshNewIds.add(id);
            knownIdsRef.current.add(id);
          }
        });
        // Only flash "NEW" badge on silent polls (not first load)
        if (silent && freshNewIds.size > 0) {
          setNewIds(freshNewIds);
          // Clear badge after 4 seconds
          setTimeout(() => setNewIds(new Set()), 4000);
        } else if (!silent) {
          // On initial load, just register all IDs silently
          res.data.forEach((r) => knownIdsRef.current.add(r._id));
        }
        setRecords(res.data);
        setPagination(res.pagination);
        currentPageRef.current = page;
      }
    } catch (err) {
      console.error("Failed to load audit log:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleManualRefresh = () => {
    loadAudit(currentPageRef.current, true);
    toast.success("Audit log refreshed!", { duration: 1500 });
  };

  // Start polling every 5 seconds
  useEffect(() => {
    loadAudit(1);
    pollIntervalRef.current = setInterval(() => {
      loadAudit(currentPageRef.current, true);
    }, 5000);
    return () => clearInterval(pollIntervalRef.current);
  }, [loadAudit]);

  const shortHash = (h) => h ? `${h.slice(0, 10)}...${h.slice(-8)}` : "N/A";
  const shortAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "N/A";

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    toast.success("Tx Hash copied!");
  };

  const getExplorerUrl = (hash) => {
    if (chainId === 1) return `https://etherscan.io/tx/${hash}`;
    if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`;
    // Hardhat (31337) or unknown has no public explorer
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-gov-navy">Audit Log</h2>
          <p className="text-gov-text/60 font-body mt-1">Complete record of all votes stored in the database.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gov-text/50">{pagination.total} records</span>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gov-blue border border-gov-blue/30 rounded-lg hover:bg-gov-blue/10 transition-colors disabled:opacity-40"
            title="Refresh audit log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gov-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-gov-blue animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gov-text/50">
            <FileText className="w-10 h-10 mb-2" />
            <p>No audit records yet. Cast a vote first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gov-navy text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Tx Hash</th>
                  <th className="px-4 py-3 text-left">Voter</th>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-center">Block</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const isNew = newIds.has(r._id);
                  return (
                    <tr
                      key={r._id || i}
                      className={`border-b border-gov-border/20 hover:bg-gov-light/50 transition-colors ${
                        isNew ? "bg-green-50 animate-pulse" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gov-blue">
                        <div className="flex items-center gap-2">
                          {isNew && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded animate-bounce">
                              NEW
                            </span>
                          )}
                          {getExplorerUrl(r.txHash) ? (
                            <a
                              href={getExplorerUrl(r.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:underline text-gov-blue hover:text-gov-navy"
                              title="View transaction on Block Explorer"
                            >
                              {shortHash(r.txHash)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span
                              className="flex items-center gap-1 text-gov-text/50 cursor-not-allowed"
                              title="Block explorer not available for local Hardhat network (Chain ID: 31337)"
                            >
                              {shortHash(r.txHash)}
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </span>
                          )}
                          <button
                            onClick={() => handleCopy(r.txHash)}
                            className="text-gov-text/40 hover:text-gov-blue transition-colors"
                            title="Copy full hash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-xs text-gov-text"
                        title={r.voterAddress}
                      >
                        {shortAddr(r.voterAddress)}
                      </td>
                      <td className="px-4 py-3 text-gov-navy font-medium">
                        {r.candidateName || `Candidate #${r.candidateId}`}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs">
                        {r.blockNumber || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                            r.status === "confirmed"
                              ? "bg-gov-success/10 text-gov-success"
                              : r.status === "pending"
                              ? "bg-gov-gold/10 text-gov-gold"
                              : "bg-gov-danger/10 text-gov-danger"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gov-text/60">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gov-border/20">
            <button onClick={() => loadAudit(pagination.page - 1)} disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1 text-xs text-gov-blue hover:bg-gov-blue/10 rounded disabled:opacity-30">
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <span className="text-xs text-gov-text/60">Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => loadAudit(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 px-3 py-1 text-xs text-gov-blue hover:bg-gov-blue/10 rounded disabled:opacity-30">
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLog;
