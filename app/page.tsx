// @ts-nocheck
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateSavings, getPlansForTool } from "../src/lib/audit/auditEngine";

const SPRING_SOFT = { type: "spring" as const, stiffness: 300, damping: 24 };

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
      setAiResponse("⚠️ Deployment Error: Check Vercel Environment Variables.");
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
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans selection:bg-blue-500/30">
      <main className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-tighter mb-4 text-slate-100 uppercase">Credex AI Auditor</h1>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
             <p className="text-xs uppercase font-bold text-slate-500 mb-2 tracking-widest">Monthly Potential Savings</p>
             <p className="text-6xl font-mono text-green-400 font-bold tracking-tight">${totals.savings.toLocaleString()}</p>
             <p className="text-sm text-slate-400 mt-2">Current Spend: ${totals.current.toLocaleString()}</p>
             
             <button 
                onClick={handleGetAdvice}
                disabled={isAiLoading || totals.savings === 0}
                className="mt-8 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100 shadow-lg"
             >
               {isAiLoading ? "Consulting AI..." : "Get Strategic Summary"}
             </button>
          </div>
          
          <AnimatePresence>
            {aiResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left"
              >
                <p className="text-blue-300 italic text-sm leading-relaxed">
                  {aiResponse}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOOLS.map((t, i) => {
            const r = results[i];
            const plans = getPlansForTool(t.name);
            const isGemini = t.name === "Gemini";
            
            return (
              <div key={t.name} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-200">{t.name}</h3>
                    <p className="font-mono text-slate-400 font-bold">
                      {isGemini ? "₹" : "$"}{r.currentSpend}
                    </p>
                  </div>

                  {/* RESTORED WARNINGS */}
                  {r.warning && (
                    <div className="mb-4 bg-red-900/20 text-red-400 border border-red-900/30 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                      ⚠️ {r.warning}
                    </div>
                  )}

                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-black">Plan</p>
                      <select 
                        value={configs[i].plan}
                        onChange={(e) => update(i, { plan: e.target.value })}
                        className="bg-transparent text-xs text-slate-200 font-bold outline-none cursor-pointer"
                      >
                        {plans.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-black">Seats</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="text-slate-400 hover:text-white font-bold">-</button>
                        <span className="text-xs font-mono font-bold text-slate-200">{configs[i].seats}</span>
                        <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="text-slate-400 hover:text-white font-bold">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RESTORED OPTIMIZATION BREAKDOWN */}
                {r.totalSavings > 0 && (
                   <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">Optimized: Save {isGemini ? "₹" : "$"}{r.totalSavings}</p>
                      {r.breakdown?.map((b, idx) => (
                        <p key={idx} className="text-[9px] text-slate-500 mt-1">
                          {b.type === "ghost_seats" ? "• Remove ghost seats" : "• Switch to annual"}
                        </p>
                      ))}
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
