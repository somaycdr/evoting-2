import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Users, UserPlus, Trash2, ShieldCheck, Loader2, Lock,
  UserCog, PlusCircle, XCircle, RefreshCw, AlertTriangle, CheckCircle2,
  ChevronDown, Image as ImageIcon
} from "lucide-react";

/* ─────────────────────────────────────────
   Inline styles (no Tailwind changes needed)
───────────────────────────────────────── */
const styles = {
  tabBar: {
    display: "flex",
    gap: "4px",
    borderBottom: "2px solid #e5e7eb",
    marginBottom: "24px",
  },
  tab: (active) => ({
    padding: "10px 20px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    border: "none",
    background: "none",
    borderBottom: active ? "2px solid #1e3a5f" : "2px solid transparent",
    color: active ? "#1e3a5f" : "#6b7280",
    marginBottom: "-2px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "color 0.2s",
  }),
  card: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
    padding: "24px",
  },
  badge: (type) => {
    const map = {
      active:       { background: "#dcfce7", color: "#166534" },
      disqualified: { background: "#fee2e2", color: "#991b1b" },
      authorized:   { background: "#dcfce7", color: "#166534" },
      revoked:      { background: "#fee2e2", color: "#991b1b" },
    };
    const s = map[type] || map.active;
    return { ...s, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, display: "inline-block" };
  },
  inputLabel: { display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" },
  input: {
    width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px",
    fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  btn: (variant) => {
    const base = { display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, fontSize: "13px", cursor: "pointer", border: "none", transition: "all 0.2s" };
    const variants = {
      primary:  { ...base, background: "#1e3a5f", color: "#fff" },
      danger:   { ...base, background: "#fee2e2", color: "#991b1b" },
      success:  { ...base, background: "#dcfce7", color: "#166534" },
      ghost:    { ...base, background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb" },
      gold:     { ...base, background: "#d97706", color: "#fff" },
    };
    return variants[variant] || base;
  },
};

/* ─────────────────────────────────────────
   Disqualify Modal
───────────────────────────────────────── */
function DisqualifyModal({ candidate, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const presets = [
    "Violation of election code of conduct",
    "Misuse of election guidelines",
    "Fraudulent documentation submitted",
    "Found ineligible per eligibility criteria",
    "Bribery or unfair means reported",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ background: "#fee2e2", borderRadius: "50%", padding: "8px", display: "flex" }}>
            <AlertTriangle style={{ width: 20, height: 20, color: "#dc2626" }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#111" }}>Disqualify Candidate</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{candidate.name} — {candidate.party}</p>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "#374151", marginBottom: "12px" }}>
          Select or write a disqualification reason. This action can be reversed by an administrator.
        </p>

        <div style={{ marginBottom: "12px" }}>
          <label style={styles.inputLabel}>Quick Select Reason</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
            {presets.map((p) => (
              <button key={p} onClick={() => setReason(p)}
                style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", cursor: "pointer", border: "1px solid #d1d5db", background: reason === p ? "#1e3a5f" : "#f9fafb", color: reason === p ? "#fff" : "#374151", fontWeight: 500 }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={styles.inputLabel}>Custom Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Describe the reason for disqualification..."
            style={{ ...styles.input, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={styles.btn("ghost")}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim()} style={{ ...styles.btn("danger"), opacity: reason.trim() ? 1 : 0.5, background: "#dc2626", color: "#fff" }}>
            <XCircle style={{ width: 16, height: 16 }} /> Disqualify
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Add Candidate Form
───────────────────────────────────────── */
function AddCandidateForm({ onSuccess }) {
  const [form, setForm] = useState({ name: "", party: "", constituency: "", description: "", photoUrl: "", age: "" });
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (e.target.name === "photoUrl") setPreviewUrl(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.party.trim()) return toast.error("Name and Party are required.");
    setSaving(true);
    try {
      const res = await axios.post("/api/candidates", form);
      if (res.data.success) {
        toast.success("Candidate added to election!");
        setForm({ name: "", party: "", constituency: "", description: "", photoUrl: "", age: "" });
        setPreviewUrl("");
        onSuccess();
      } else {
        toast.error(res.data.error || "Failed to add candidate.");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error adding candidate.");
    } finally {
      setSaving(false);
    }
  };

  const avatarFallback = form.name
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(form.name)}&backgroundColor=c0aede`
    : null;

  return (
    <div style={styles.card}>
      <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#1e3a5f", display: "flex", alignItems: "center", gap: "8px" }}>
        <PlusCircle style={{ width: 18, height: 18, color: "#d97706" }} />
        Add New Candidate
      </h3>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Photo Preview */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #e5e7eb", overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {(previewUrl || avatarFallback) ? (
              <img src={previewUrl || avatarFallback} alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.src = avatarFallback || ""; }}
              />
            ) : (
              <ImageIcon style={{ width: 28, height: 28, color: "#9ca3af" }} />
            )}
          </div>
        </div>

        <div>
          <label style={styles.inputLabel}>Full Name *</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Arjun Sharma" style={styles.input} required />
        </div>

        <div>
          <label style={styles.inputLabel}>Party Name *</label>
          <input name="party" value={form.party} onChange={handleChange} placeholder="e.g. Progressive Students Alliance" style={styles.input} required />
        </div>

        <div>
          <label style={styles.inputLabel}>Department / Constituency</label>
          <input name="constituency" value={form.constituency} onChange={handleChange} placeholder="e.g. Computer Science" style={styles.input} />
        </div>

        <div>
          <label style={styles.inputLabel}>Age</label>
          <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="e.g. 21" min={18} max={60} style={styles.input} />
        </div>

        <div>
          <label style={styles.inputLabel}>Profile Photo URL</label>
          <input name="photoUrl" value={form.photoUrl} onChange={handleChange} placeholder="https://... (leave blank for auto-avatar)" style={styles.input} />
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>Leave blank to auto-generate avatar from name.</p>
        </div>

        <div>
          <label style={styles.inputLabel}>Description / Manifesto</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            placeholder="Brief description of the candidate's platform..."
            style={{ ...styles.input, resize: "vertical", fontFamily: "inherit" }} />
        </div>

        <button type="submit" disabled={saving} style={{ ...styles.btn("primary"), justifyContent: "center", padding: "10px" }}>
          {saving ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <PlusCircle style={{ width: 16, height: 16 }} />}
          {saving ? "Adding to blockchain..." : "Add Candidate"}
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────
   Candidate Management Tab
───────────────────────────────────────── */
function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disqualifyTarget, setDisqualifyTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => { fetchCandidates(); }, []);

  async function fetchCandidates() {
    try {
      setLoading(true);
      const res = await axios.get("/api/candidates");
      if (res.data.success) setCandidates(res.data.data);
    } catch {
      toast.error("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisqualify(candidate, reason) {
    setDisqualifyTarget(null);
    setActionLoading((p) => ({ ...p, [candidate.id]: true }));
    try {
      const res = await axios.delete(`/api/candidates/${candidate.id}`, { data: { reason } });
      if (res.data.success) {
        toast.success(`${candidate.name} has been disqualified.`);
        fetchCandidates();
      } else {
        toast.error(res.data.error || "Failed to disqualify.");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error disqualifying candidate.");
    } finally {
      setActionLoading((p) => ({ ...p, [candidate.id]: false }));
    }
  }

  async function handleRestore(candidate) {
    if (!window.confirm(`Restore ${candidate.name} to active status?`)) return;
    setActionLoading((p) => ({ ...p, [candidate.id]: true }));
    try {
      const res = await axios.patch(`/api/candidates/${candidate.id}/restore`);
      if (res.data.success) {
        toast.success(`${candidate.name} has been restored.`);
        fetchCandidates();
      } else {
        toast.error(res.data.error || "Failed to restore.");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error restoring candidate.");
    } finally {
      setActionLoading((p) => ({ ...p, [candidate.id]: false }));
    }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
      <Loader2 style={{ width: 36, height: 36, color: "#1e3a5f", animation: "spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
      <AddCandidateForm onSuccess={fetchCandidates} />

      {/* Candidates List */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e3a5f", display: "flex", alignItems: "center", gap: "8px" }}>
            <UserCog style={{ width: 18, height: 18, color: "#1e3a5f" }} />
            Registered Candidates ({candidates.length})
          </h3>
          <button onClick={fetchCandidates} style={styles.btn("ghost")}>
            <RefreshCw style={{ width: 14, height: 14 }} /> Refresh
          </button>
        </div>

        {candidates.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px" }}>No candidates found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {candidates.map((c) => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 16px", borderRadius: "10px", border: "1px solid #e5e7eb",
                background: c.isDisqualified ? "#fff5f5" : "#f9fafb",
                opacity: c.isDisqualified ? 0.85 : 1,
              }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: "2px solid #e5e7eb", background: "#f3f4f6" }}>
                  <img
                    src={c.photoUrl}
                    alt={c.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=c0aede`; }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#111" }}>{c.name}</span>
                    <span style={styles.badge(c.isDisqualified ? "disqualified" : "active")}>
                      {c.isDisqualified ? "Disqualified" : "Active"}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                    🏛 {c.party} · 📍 {c.constituency} · 🗳 {c.voteCount} votes
                  </div>
                  {c.isDisqualified && c.disqualificationReason && (
                    <div style={{ marginTop: "6px", padding: "6px 10px", background: "#fee2e2", borderRadius: "6px", fontSize: "12px", color: "#991b1b" }}>
                      <strong>Reason:</strong> {c.disqualificationReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {actionLoading[c.id] ? (
                    <Loader2 style={{ width: 18, height: 18, color: "#6b7280", animation: "spin 1s linear infinite" }} />
                  ) : c.isDisqualified ? (
                    <button onClick={() => handleRestore(c)} title="Restore candidate" style={styles.btn("success")}>
                      <CheckCircle2 style={{ width: 14, height: 14 }} /> Restore
                    </button>
                  ) : (
                    <button onClick={() => setDisqualifyTarget(c)} title="Disqualify candidate" style={styles.btn("danger")}>
                      <XCircle style={{ width: 14, height: 14 }} /> Disqualify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disqualify Modal */}
      {disqualifyTarget && (
        <DisqualifyModal
          candidate={disqualifyTarget}
          onConfirm={(reason) => handleDisqualify(disqualifyTarget, reason)}
          onClose={() => setDisqualifyTarget(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main AdminPanel Component
───────────────────────────────────────── */
function AdminPanel() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [activeTab, setActiveTab] = useState("voters");

  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    walletAddress: "",
    name: "",
    email: "",
    studentId: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchVoters();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (authForm.username === "admin" && authForm.password === "admin123") {
      setIsAuthenticated(true);
      toast.success("Welcome, Admin");
    } else {
      toast.error("Invalid username or password");
    }
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  async function fetchVoters() {
    try {
      setLoading(true);
      const res = await axios.get("/api/voters");
      if (res.data.success) {
        setVoters(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load voters.");
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.walletAddress || !formData.name) {
      return toast.error("Wallet Address and Name are required!");
    }

    setRegistering(true);
    try {
      const res = await axios.post("/api/voters/register", formData);
      if (res.data.success) {
        toast.success("Voter registered successfully!");
        setFormData({ walletAddress: "", name: "", email: "", studentId: "" });
        fetchVoters();
      } else {
        toast.error(res.data.error || "Failed to register voter");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error registering voter");
    } finally {
      setRegistering(false);
    }
  };

  const handleRevoke = async (walletAddress) => {
    if (!window.confirm(`Are you sure you want to permanently delete the voter ${walletAddress}?`)) return;

    try {
      const res = await axios.delete(`/api/voters/${walletAddress}`);
      if (res.data.success) {
        toast.success("Voter authorization revoked.");
        fetchVoters();
      } else {
        toast.error("Failed to revoke authorization.");
      }
    } catch (err) {
      toast.error("Error revoking authorization.");
    }
  };

  const handleStopElection = async () => {
    if (!window.confirm("Are you sure you want to STOP the election manually? This action cannot be undone.")) return;

    try {
      const res = await axios.post("/api/election/stop");
      if (res.data.success) {
        toast.success("Election successfully stopped.");
      } else {
        toast.error(res.data.error || "Failed to stop election.");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error stopping election.");
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-xl shadow-md border border-gov-border w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-gov-navy text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-gov-navy">Admin Access</h2>
            <p className="text-gray-500 text-sm mt-1">Please enter your credentials to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gov-text mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={authForm.username}
                onChange={handleAuthChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gov-text mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 mt-2 bg-gov-gold text-gov-navy font-bold rounded-lg hover:bg-yellow-500 transition-colors shadow-md"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-heading text-2xl font-bold text-gov-navy flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-gov-gold" />
            Administrator Panel
          </h2>
          <p className="text-gov-text/60 font-body mt-1">
            Manage authorized voters, candidates, and system access.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleStopElection}
            className="text-sm px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-md font-medium"
          >
            Stop Election
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-sm px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        <button style={styles.tab(activeTab === "voters")} onClick={() => setActiveTab("voters")}>
          <Users style={{ width: 15, height: 15 }} /> Voter Management
        </button>
        <button style={styles.tab(activeTab === "candidates")} onClick={() => setActiveTab("candidates")}>
          <UserCog style={{ width: 15, height: 15 }} /> Candidate Management
        </button>
      </div>

      {/* ── Voter Management Tab ── */}
      {activeTab === "voters" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Register New Voter Form */}
          <div className="bg-white rounded-xl border border-gov-border shadow-sm p-6 lg:col-span-1 h-fit">
            <h3 className="font-heading text-lg font-bold text-gov-navy mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gov-blue" />
              Register New Voter
            </h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gov-text mb-1">Wallet Address *</label>
                <input
                  type="text"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gov-blue focus:border-transparent outline-none font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gov-text mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Somay Sharma"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gov-blue focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gov-text mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="student@college.edu"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gov-blue focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gov-text mb-1">Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="2021CS001"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gov-blue focus:border-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={registering}
                className="w-full py-2 bg-gov-navy text-white rounded font-medium hover:bg-gov-blue transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {registering ? "Registering..." : "Register Voter"}
              </button>
            </form>
          </div>

          {/* Registered Voters List */}
          <div className="bg-white rounded-xl border border-gov-border shadow-sm p-6 lg:col-span-2">
            <h3 className="font-heading text-lg font-bold text-gov-navy mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gov-blue" />
              Authorized Voters Directory
            </h3>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gov-blue" />
              </div>
            ) : voters.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No registered voters found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gov-text/70">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Wallet Address</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {voters.map((v) => (
                      <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gov-navy">{v.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {v.walletAddress.substring(0, 6)}...{v.walletAddress.substring(38)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div>{v.studentId || "-"}</div>
                          <div className="text-xs">{v.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {v.isAuthorized ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Authorized
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Revoked
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRevoke(v.walletAddress)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                            title="Delete Voter Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Candidate Management Tab ── */}
      {activeTab === "candidates" && <CandidateManagement />}
    </div>
  );
}

export default AdminPanel;
