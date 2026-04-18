"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, Eye, EyeOff, ShieldAlert, Zap, 
  Sparkles, ChevronDown, PlusCircle, Wallet, Key
} from "lucide-react";
import { generateMnemonic, deriveAccounts, attachBalances, NetworkType } from "@/lib/wallet";

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-md rounded-3xl p-6 transition-all ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", ...props }: any) => {
  const base = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all active:scale-[0.98]";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white"
  };
  
  return (
    <button onClick={onClick} className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default function Home() {
  const [tab, setTab] = useState<"generate" | "import">("generate");
  const [network, setNetwork] = useState<NetworkType>("devnet");
  const [mnemonic, setMnemonic] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);

  const handleLoadAccounts = async () => {
    if (!mnemonic) return;
    setLoading(true);
    const count = tab === "generate" ? 5 : 10;
    const accs = await deriveAccounts(mnemonic, count);
    const withBalances = await attachBalances(accs, network);
    setAccounts(withBalances);
    setLoading(false);
  };

  const handleAddAccount = async () => {
    if (!mnemonic) return;
    setLoading(true);
    const newAccs = await deriveAccounts(mnemonic, accounts.length + 1);
    const [withBalance] = await attachBalances([newAccs[newAccs.length - 1]], network);
    setAccounts(prev => [...prev, withBalance]);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-900/20 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-5xl mx-auto relative space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Wallet Engine</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">Studio <span className="text-zinc-600">v1.0</span></h1>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-full p-1 flex">
            {(["devnet", "mainnet"] as const).map((n) => (
              <button key={n} onClick={() => setNetwork(n)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${network === n ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {n.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="grid md:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="md:col-span-4">
            <Card className="h-full">
              <div className="flex gap-2 mb-6">
                {(["generate", "import"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-400"}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                className="w-full h-32 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none mb-4"
                placeholder="Paste your 12-word recovery phrase..."
              />

              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button variant="secondary" onClick={() => setMnemonic(generateMnemonic())}>
                  <RefreshCw size={14} /> Seed
                </Button>
                <Button onClick={handleLoadAccounts} disabled={loading}>
                  <Zap size={14} /> {loading ? "Loading..." : "Derive"}
                </Button>
              </div>

              <Button className="w-full" variant="ghost" onClick={handleAddAccount}>
                <PlusCircle size={14} /> Add New Wallet
              </Button>
            </Card>
          </div>

          {/* Results */}
          <div className="md:col-span-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Active Wallets</h2>
              <button onClick={() => setShowPrivate(!showPrivate)} className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition uppercase tracking-wider flex items-center gap-2">
                {showPrivate ? <EyeOff size={14} /> : <Eye size={14} />} 
                {showPrivate ? "Hide Keys" : "Show Keys"}
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {accounts.map((acc) => (
                  <motion.div 
                    key={acc.publicKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-zinc-900/50 border border-zinc-800/60 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center font-bold text-indigo-400">
                        {acc.index}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-mono text-zinc-300 truncate max-w-[200px] md:max-w-md">
                          {acc.publicKey}
                        </p>
                        {showPrivate && (
                          <p className="text-[10px] text-indigo-400 font-mono mt-1 tracking-tight">
                            SK: {acc.secretKey.slice(0, 16)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <p className="font-bold text-white">{acc.balance} <span className="text-zinc-500 text-xs font-normal">SOL</span></p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}