import React, { useState, useEffect } from "react";
import { fetchAuditLog } from "../utils/api";
import { FileText, ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";

function AuditLog() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  async function loadAudit(page = 1) {
    setLoading(true);
    try {
      const res = await fetchAuditLog(page);
      if (res.success) {
        setRecords(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load audit log:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAudit(); }, []);

  const shortHash = (h) => h ? `${h.slice(0, 10)}...${h.slice(-8)}` : "N/A";
  const shortAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-gov-navy">Audit Log</h2>
          <p className="text-gov-text/60 font-body mt-1">Complete record of all votes stored in the database.</p>
        </div>
        <span className="text-sm text-gov-text/50">{pagination.total} records</span>
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
                {records.map((r, i) => (
                  <tr key={r._id || i} className="border-b border-gov-border/20 hover:bg-gov-light/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gov-blue">{shortHash(r.txHash)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gov-text">{shortAddr(r.voterAddress)}</td>
                    <td className="px-4 py-3 text-gov-navy font-medium">{r.candidateName || `#${r.candidateId}`}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{r.blockNumber || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                        r.status === "confirmed" ? "bg-gov-success/10 text-gov-success" :
                        r.status === "pending" ? "bg-gov-gold/10 text-gov-gold" :
                        "bg-gov-danger/10 text-gov-danger"
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gov-text/60">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
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
