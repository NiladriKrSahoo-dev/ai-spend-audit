// @ts-nocheck
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateSavings, getPlansForTool } from "../src/lib/audit/auditEngine";

const TOOLS = [
  { name: "Cursor",         defaultPlan: "Teams",    defaultSeats: 0 },
  { name: "ChatGPT",        defaultPlan: "Business", defaultSeats: 0 },
  { name: "Claude",         defaultPlan: "Team",     defaultSeats: 0  },
  { name: "GitHub Copilot", defaultPlan: "Business", defaultSeats: 0 },
  { name: "Gemini",         defaultPlan: "Pro",      defaultSeats: 0  },
  { name: "V0.dev",         defaultPlan: "Team",     defaultSeats: 0  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [configs, setConfigs] = useState(TOOLS.map(t => ({ plan: t.defaultPlan, seats: t.defaultSeats })));
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("auditConfigs_v3");
    if (saved) {
      try { setConfigs(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const results = useMemo(() => TOOLS.map((t, i) => {
    return calculateSavings(t.name, configs[i].seats, configs[i].plan, "monthly");
  }), [configs]);

  const totals = useMemo(() => {
    const current = results.reduce((acc, r) => acc + (r.currentSpend || 0), 0);
    const savings = results.reduce((acc, r) => acc + (r.totalSavings || 0), 0);
    return { current, savings };
  }, [results]);

  const handleGetAdvice = async () => {
    setIsAiLoading(true);
    setAiResponse("");
    const topTool = [...results].sort((a,b) => b.totalSavings - a.totalSavings)[0];
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ 
          messages: [{ 
            role: "user", 
            content: `Analyze this AI audit. Saving $${totals.savings} on $${totals.current} spend. Main waste: ${topTool.toolName}. Write a 3-sentence summary.` 
          }] 
        }),
      });

      const text = await res.text();
      setAiResponse(text);
    } catch (err) {
      setAiResponse("⚠️ Check your Vercel Environment Variables for the API key.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const update = (i, patch) => {
    const next = configs.map((c, j) => j === i ? { ...c, ...patch } : c);
    setConfigs(next);
    localStorage.setItem("auditConfigs_v3", JSON.stringify(next));
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="p-6 border-b bg-white">
        <div className="max-w-6xl mx-auto flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="bg-blue-600 text-white w-8 h-8 rounded flex items-center justify-center">C</div>
          CREDEX AUDIT
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.8]">
            AI Spend <span className="text-blue-600">Optimized.</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Savings</p>
              <p className="text-6xl font-black text-green-500 tracking-tighter">${totals.savings}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Budget</p>
              <p className="text-4xl font-bold tracking-tight">${totals.current}</p>
            </div>
            <button 
              onClick={handleGetAdvice}
              disabled={isAiLoading || totals.savings === 0}
              className="bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all disabled:opacity-20 active:scale-95 shadow-xl uppercase tracking-tight"
            >
              {isAiLoading ? "Analyzing..." : "Generate AI Report"}
            </button>
          </div>

          <AnimatePresence>
            {aiResponse && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-10 bg-blue-50 border border-blue-100 rounded-[2.5rem] text-blue-900 font-semibold text-lg leading-relaxed shadow-inner">
                {aiResponse}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TOOLS.map((t, i) => (
            <div key={t.name} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all">
              <div className="mb-6 flex justify-between items-start">
                <h3 className="font-black text-2xl tracking-tight uppercase">{t.name}</h3>
                <span className="text-slate-300 font-black font-mono">
                  {t.name === "Gemini" ? `₹${results[i].currentSpend}` : `$${results[i].currentSpend}`}
                </span>
              </div>
              <div className="space-y-4">
                <select 
                  value={configs[i].plan} 
                  onChange={e => update(i, { plan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-bold text-sm outline-none cursor-pointer"
                >
                  {getPlansForTool(t.name).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="flex items-center gap-3">
                  <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="w-12 h-12 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-colors">-</button>
                  <span className="flex-1 text-center font-black text-xl">{configs[i].seats}</span>
                  <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="w-12 h-12 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-colors">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
