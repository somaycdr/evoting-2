import React from "react";
import { NavLink } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import {
  LayoutDashboard,
  Vote,
  ShieldCheck,
  FileText,
  Wallet,
  Wifi,
  WifiOff,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vote", label: "Cast Vote", icon: Vote },
  { to: "/verifier", label: "Verifier", icon: ShieldCheck },
  { to: "/audit", label: "Audit Log", icon: FileText },
  { to: "/admin", label: "Admin Panel", icon: Settings },
];

function Sidebar() {
  const { account, isConnecting, isCorrectNetwork, connectWallet, disconnectWallet } = useWeb3();

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gov-navy text-white flex flex-col z-50 shadow-xl">
      {/* Brand */}
      <div className="p-6 border-b border-gov-blue/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-gold/20 flex items-center justify-center">
            <Vote className="w-5 h-5 text-gov-gold" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold tracking-wide text-white">
              E-Voting
            </h1>
            <p className="text-xs text-gov-border opacity-70">
              Blockchain Secured
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body transition-all duration-200 ${
                isActive
                  ? "bg-gov-blue text-white shadow-lg shadow-gov-blue/25"
                  : "text-gov-border hover:bg-gov-blue/20 hover:text-white"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Network Status */}
      <div className="px-4 py-3 border-t border-gov-blue/30">
        <div className="flex items-center gap-2 text-xs">
          {isCorrectNetwork ? (
            <>
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Hardhat Network</span>
            </>
          ) : account ? (
            <>
              <WifiOff className="w-3 h-3 text-red-400" />
              <span className="text-red-400">Wrong Network</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-gray-500" />
              <span className="text-gray-500">Not Connected</span>
            </>
          )}
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="p-4 border-t border-gov-blue/30">
        {account ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-gov-blue/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-mono text-gov-border">
                {shortAddress}
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="w-full px-3 py-2 text-xs text-gov-border hover:text-white hover:bg-gov-danger/40 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gov-gold hover:bg-gov-amber text-gov-navy font-semibold text-sm rounded-lg transition-all duration-200 shadow-lg shadow-gov-gold/25 disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
