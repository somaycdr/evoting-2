import React, { useState, useEffect, useCallback } from "react";
import { fetchCandidates, fetchElectionStats } from "../utils/api";
import { useWeb3 } from "../context/Web3Context";
import {
  Users,
  Vote,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from "lucide-react";

const partyColors = {
  "Progressive Alliance": { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50" },
  "National Reform Party": { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50" },
  "United Front": { bg: "bg-purple-500", text: "text-purple-600", light: "bg-purple-50" },
  "Green India Party": { bg: "bg-teal-500", text: "text-teal-600", light: "bg-teal-50" },
};

function Dashboard() {
  const { account } = useWeb3();
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [candRes, statsRes] = await Promise.all([
        fetchCandidates(),
        fetchElectionStats(),
      ]);
      if (candRes.success) setCandidates(candRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!stats?.endTime) return;
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = stats.endTime - now;
      if (diff <= 0) {
        setTimeLeft("Election Ended");
        clearInterval(timer);
        return;
      }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [stats?.endTime]);

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const maxVotes = Math.max(...candidates.map((c) => c.voteCount), 1);

  // Result calculation when election is stopped
  let winners = [];
  let isDeadHeat = false;
  if (stats && !stats.isActive && candidates.length > 0) {
    const highestVotes = Math.max(...candidates.map((c) => c.voteCount), 0);
    if (highestVotes > 0) {
      winners = candidates.filter((c) => c.voteCount === highestVotes);
      if (winners.length > 1) {
        isDeadHeat = true;
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-gov-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Candidates"
          value={stats?.totalCandidates || candidates.length}
          color="text-gov-blue"
          bgColor="bg-gov-blue/10"
        />
        <StatCard
          icon={Vote}
          label="Total Votes Cast"
          value={stats?.totalVotes || totalVotes}
          color="text-gov-gold"
          bgColor="bg-gov-gold/10"
        />
        <StatCard
          icon={Clock}
          label="Time Remaining"
          value={timeLeft || "--:--:--"}
          color="text-gov-sky"
          bgColor="bg-gov-sky/10"
          isTimer
        />
        <StatCard
          icon={TrendingUp}
          label="Election Status"
          value={stats?.isActive ? "ACTIVE" : "INACTIVE"}
          color={stats?.isActive ? "text-gov-success" : "text-gov-danger"}
          bgColor={stats?.isActive ? "bg-gov-success/10" : "bg-gov-danger/10"}
        />
      </div>

      {/* Election Results Banner */}
      {stats && !stats.isActive && (
        <div className="bg-gradient-to-r from-gov-gold/20 to-yellow-100 border-2 border-gov-gold rounded-xl p-8 mb-6 text-center shadow-lg transform transition-all duration-500 hover:scale-[1.01]">
          <h2 className="text-3xl font-heading font-extrabold text-gov-navy mb-6 drop-shadow-sm">
            🎉 Final Election Results 🎉
          </h2>
          {winners.length === 0 ? (
            <p className="text-lg text-gov-navy font-medium bg-white/60 py-3 rounded-lg inline-block px-6">
              No votes were cast in this election.
            </p>
          ) : isDeadHeat ? (
            <div className="animate-fade-in-up">
              <div className="inline-block bg-red-100 border border-red-200 px-6 py-2 rounded-full mb-6 shadow-sm">
                <p className="text-xl text-red-600 font-bold uppercase tracking-wider">
                  Dead Heat! (Tie)
                </p>
              </div>
              <p className="text-lg text-gov-navy mb-6 font-medium">
                The following candidates have tied with <span className="font-bold text-xl bg-white px-2 py-1 rounded shadow-sm">{winners[0].voteCount}</span> votes each:
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                {winners.map(w => (
                  <div key={w.id} className="bg-white px-6 py-4 rounded-xl shadow-md border-b-4 border-gov-gold flex flex-col items-center min-w-[200px] transform transition hover:-translate-y-1">
                    <img src={w.photoUrl} alt={w.name} className="w-16 h-16 rounded-full border-2 border-gray-200 mb-3 object-cover bg-gray-50" />
                    <p className="font-bold text-xl text-gov-navy">{w.name}</p>
                    <p className="text-sm font-medium text-gov-blue/80 mt-1">{w.party}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up flex flex-col items-center">
              <p className="text-xl text-gov-navy mb-4 font-medium">The clear winner is:</p>
              <div className="bg-white px-10 py-6 rounded-2xl shadow-xl border-b-4 border-green-500 text-center min-w-[300px] transform transition hover:scale-105">
                <img src={winners[0].photoUrl} alt={winners[0].name} className="w-24 h-24 rounded-full border-4 border-green-100 mx-auto mb-4 object-cover shadow-sm bg-gray-50" />
                <p className="text-3xl font-extrabold text-green-600 mb-1">{winners[0].name}</p>
                <p className="text-md font-semibold text-gray-500 mb-4">{winners[0].party}</p>
                <div className="bg-green-50 rounded-lg py-2 px-4 inline-block border border-green-100">
                  <p className="font-mono text-2xl text-gov-navy font-bold">
                    {winners[0].voteCount} <span className="text-lg text-gray-500">Votes</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      <div className="bg-white rounded-xl border border-gov-border/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gov-border/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gov-blue" />
            <h3 className="font-heading text-lg font-bold text-gov-navy">
              Live Vote Tally
            </h3>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gov-blue hover:bg-gov-blue/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="p-6 space-y-5">
          {candidates.map((candidate) => {
            const pct = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
            const barWidth = totalVotes > 0 ? (candidate.voteCount / maxVotes) * 100 : 0;
            const colors = partyColors[candidate.party] || { bg: "bg-gray-500", text: "text-gray-600", light: "bg-gray-50" };

            return (
              <div key={candidate.id} className={`p-4 rounded-lg ${colors.light} border border-gov-border/20`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={candidate.photoUrl}
                      alt={candidate.name}
                      className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm"
                    />
                    <div>
                      <h4 className="font-heading font-semibold text-gov-navy">
                        {candidate.name}
                      </h4>
                      <p className={`text-xs ${colors.text} font-medium`}>
                        {candidate.party}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gov-navy font-mono">
                      {candidate.voteCount}
                    </p>
                    <p className="text-xs text-gov-text/60">{pct}%</p>
                  </div>
                </div>

                <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bg} transition-all duration-700 ease-out`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}

          {candidates.length === 0 && (
            <p className="text-center text-gov-text/50 py-8">
              No candidates found. Deploy the contract and seed candidates first.
            </p>
          )}
        </div>
      </div>

      {/* Wallet Prompt */}
      {!account && (
        <div className="bg-gov-navy/5 border border-gov-navy/10 rounded-xl p-6 text-center">
          <p className="text-gov-navy font-body">
            Connect your MetaMask wallet to cast votes and interact with the blockchain.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor, isTimer }) {
  return (
    <div className="bg-white rounded-xl border border-gov-border/50 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-gov-text/60 font-body">{label}</p>
          <p className={`text-xl font-bold ${color} ${isTimer ? "font-mono" : "font-heading"}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
