import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "./context/Web3Context";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import CastVote from "./pages/CastVote";
import Verifier from "./pages/Verifier";
import AuditLog from "./pages/AuditLog";
import AdminPanel from "./pages/AdminPanel";


function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-gov-light">
          <Sidebar />
          <div className="flex-1 ml-64">
            <Header />
            <main className="p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vote" element={<CastVote />} />
                <Route path="/verifier" element={<Verifier />} />
                <Route path="/audit" element={<AuditLog />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0A2540",
              color: "#EDF2F7",
              fontFamily: "'Source Serif 4', Georgia, serif",
              border: "1px solid #C9932A",
            },
          }}
        />
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;
