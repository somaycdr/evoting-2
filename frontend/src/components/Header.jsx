import React from "react";
import { ShieldCheck, Radio } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

function Header() {
  const { account, isCorrectNetwork } = useWeb3();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gov-border/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-gov-blue" />
          <div>
            <h2 className="font-heading text-xl font-bold text-gov-navy">
              YMCA Student election 2026
            </h2>
            <p className="text-xs text-gov-text/60 font-body">
              Decentralized • Transparent • Immutable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {account && isCorrectNetwork && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gov-success/10 border border-gov-success/30 rounded-full">
              <Radio className="w-3 h-3 text-gov-success animate-pulse" />
              <span className="text-xs font-semibold text-gov-success uppercase tracking-wider">
                Blockchain Active
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
