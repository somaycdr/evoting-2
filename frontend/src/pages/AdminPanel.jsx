import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Users, UserPlus, Trash2, ShieldCheck, Loader2, Lock } from "lucide-react";

function AdminPanel() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authForm, setAuthForm] = useState({ username: "", password: "" });

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
    // Hardcoded credentials for simple frontend protection
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
        fetchVoters(); // Refresh list
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
        fetchVoters(); // Refresh list
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

  // If not authenticated, show login form
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-heading text-2xl font-bold text-gov-navy flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-gov-gold" />
            Administrator Panel
          </h2>
          <p className="text-gov-text/60 font-body mt-1">
            Manage authorized voters and system access.
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
    </div>
  );
}

export default AdminPanel;
