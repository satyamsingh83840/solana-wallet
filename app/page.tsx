"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Sparkles,
  PlusCircle,
  Copy,
  ShieldAlert,
  Loader2,
} from "lucide-react";

import {
  generateMnemonic,
  deriveAccounts,
  attachBalances,
  NetworkType,
} from "@/lib/wallet";

// --- UI helpers ---

const Card = ({ children }: any) => (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
    {children}
  </div>
);

const Toast = ({ text }: { text: string }) => (
  <motion.div
    initial={{ y: 40, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg"
  >
    {text}
  </motion.div>
);

// --- MAIN ---

export default function Home() {
  const [mode, setMode] = useState<"generate" | "import">("generate");

  const [mnemonic, setMnemonic] = useState("");
  const [inputSeed, setInputSeed] = useState("");

  const [accounts, setAccounts] = useState<any[]>([]);
  const [network, setNetwork] = useState<NetworkType>("devnet");

  const [showMnemonic, setShowMnemonic] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const [accountIndex, setAccountIndex] = useState(0);

  const words = mnemonic ? mnemonic.split(" ") : [];

  // 🔑 Auto derive wallets
  useEffect(() => {
    if (!mnemonic) return;

    const load = async () => {
      setLoading(true);

      const accs = await deriveAccounts(mnemonic, 3);
      const withBalances = await attachBalances(accs, network);

      setAccounts(withBalances);
      setAccountIndex(withBalances.length);

      setLoading(false);
    };

    load();
  }, [mnemonic, network]);

  // --- Actions ---

  const handleGenerate = () => setShowWarning(true);

  const confirmGenerate = () => {
    setMnemonic(generateMnemonic());
    setShowMnemonic(false);
    setShowWarning(false);
    setToast("New wallet generated");
    setTimeout(() => setToast(""), 2000);
  };

  const handleImport = () => {
    const cleaned = inputSeed.trim();
    const words = cleaned.split(/\s+/);

    if (words.length !== 12) {
      setToast("Seed must be 12 words");
      setTimeout(() => setToast(""), 2000);
      return;
    }

    setMnemonic(cleaned);
    setShowMnemonic(false);
    setToast("Wallet imported");
    setTimeout(() => setToast(""), 2000);
  };

  const copySeed = () => {
    if (!mnemonic) return;

    navigator.clipboard.writeText(mnemonic);
    setToast("Copied seed phrase");
    setTimeout(() => setToast(""), 2000);
  };

  const addWallet = async () => {
    if (!mnemonic || loading) return;

    setLoading(true);

    try {
      const accs = await deriveAccounts(mnemonic, accountIndex + 1);
      const nextAccount = accs[accountIndex];

      if (!nextAccount) throw new Error();

      const [withBalance] = await attachBalances(
        [nextAccount],
        network
      );

      setAccounts((prev) => [...prev, withBalance]);
      setAccountIndex((prev) => prev + 1);

      setToast("New account added");
    } catch {
      setToast("Failed to add account");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white p-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast text={toast} />}
      </AnimatePresence>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 max-w-sm w-full">
              <div className="flex items-center gap-2 text-red-400 mb-3">
                <ShieldAlert size={18} />
                <span className="font-bold">Secret Phrase Warning</span>
              </div>

              <p className="text-sm text-zinc-400 mb-6">
                This phrase gives full access to your wallet. Store it securely.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 bg-zinc-800 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmGenerate}
                  className="flex-1 bg-indigo-600 py-2 rounded-xl"
                >
                  Continue
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Wallet Studio</h1>

          <div className="flex gap-2">
            {(["devnet", "mainnet"] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNetwork(n)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  network === n ? "bg-indigo-600" : "bg-zinc-800"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-6">

          {/* LEFT PANEL */}
          <div className="md:col-span-5">
            <Card>

              {/* MODE SWITCH */}
              <div className="flex mb-4 bg-zinc-800 p-1 rounded-xl">
                {["generate", "import"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setMode(t as any)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      mode === t
                        ? "bg-indigo-600 text-white"
                        : "text-zinc-400"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* SEED / IMPORT */}
              {mode === "generate" ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-zinc-800 bg-zinc-950 flex justify-between text-sm font-mono"
                    >
                      <span className="text-zinc-500 text-xs">{i + 1}</span>
                      <span className="ml-2 font-medium">
                        {words[i]
                          ? showMnemonic
                            ? words[i]
                            : "••••"
                          : "••••"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  value={inputSeed}
                  onChange={(e) => setInputSeed(e.target.value)}
                  placeholder="Enter your 12-word secret phrase..."
                  className="w-full h-32 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm outline-none resize-none mb-4"
                />
              )}

              {/* ACTIONS */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="flex-1 bg-zinc-800 py-2 rounded-xl flex items-center justify-center gap-2"
                >
                  {showMnemonic ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showMnemonic ? "Hide" : "Show"}
                </button>

                <button
                  onClick={copySeed}
                  className="flex-1 bg-zinc-800 py-2 rounded-xl flex items-center justify-center gap-2"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>

              {/* MAIN BUTTON */}
              <button
                onClick={mode === "generate" ? handleGenerate : handleImport}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-[1px]"
              >
                <div className="bg-zinc-900 rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-zinc-800">
                  <Sparkles size={16} />
                  {mode === "generate"
                    ? "Generate Wallet"
                    : "Import Wallet"}
                </div>
              </button>

              {/* ADD ACCOUNT */}
              <button
                onClick={addWallet}
                disabled={!mnemonic || loading || mode === "import"}
                className="w-full mt-3 bg-zinc-800 py-2 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <PlusCircle size={14} />
                Add Account
              </button>

            </Card>
          </div>

          {/* RIGHT PANEL */}
          <div className="md:col-span-7">
            <Card>

              <h2 className="text-lg font-bold mb-4">Accounts</h2>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((acc, i) => (
                    <div
                      key={acc.publicKey}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs text-zinc-500">
                          Wallet {i + 1}
                        </p>
                        <p className="text-sm font-mono truncate max-w-[200px]">
                          {acc.publicKey}
                        </p>
                      </div>

                      <p className="font-bold">
                        {acc.balance}{" "}
                        <span className="text-xs text-zinc-500">SOL</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

            </Card>
          </div>

        </div>
      </div>
    </main>
  );
}