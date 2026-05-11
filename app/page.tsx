// @ts-nocheck
"use client";

import { useState, useMemo, useEffect } from "react";
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
            content: `Analyze this AI audit. Saving $${totals.savings} on $${totals.current} spend. Main waste: ${topTool?.toolName || 'General'}. Write a 3-sentence summary.` 
          }] 
        }),
      });

      const text = await res.text();
      setAiResponse(text);
    } catch (err) {
      setAiResponse("⚠️ AI Error: Ensure GOOGLE_GENERATIVE_AI_API_KEY is correct in Vercel.");
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
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans">
      <main className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-tighter mb-4 text-slate-100 uppercase">Credex AI Auditor</h1>
          <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl shadow-2xl">
             <p className="text-xs uppercase font-bold text-slate-500 mb-2 tracking-widest font-mono">Monthly Potential Savings</p>
             <p className="text-7xl font-mono text-green-400 font-bold tracking-tight">${totals.savings.toLocaleString()}</p>
             <p className="text-sm text-slate-400 mt-2 font-mono">Current Spend: ${totals.current.toLocaleString()}</p>
             
             <button 
                onClick={handleGetAdvice}
                disabled={isAiLoading || totals.savings === 0}
                className="mt-8 bg-white text-black px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100 shadow-xl"
             >
               {isAiLoading ? "Consulting AI..." : "Get Strategic Summary"}
             </button>
          </div>
          
          <AnimatePresence>
            {aiResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left"
              >
                <p className="text-blue-300 italic text-[15px] leading-relaxed font-medium">
                  {aiResponse}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((t, i) => {
            const r = results[i];
            const plans = getPlansForTool(t.name);
            const isGemini = t.name === "Gemini";
            
            return (
              <div key={t.name} className="bg-[#0f172a]/80 p-8 rounded-[2rem] border border-slate-800 flex flex-col justify-between hover:border-slate-600 transition-colors shadow-lg">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-2xl text-slate-100 tracking-tight">{t.name}</h3>
                    <p className="font-mono text-slate-400 font-bold text-lg">
                      {isGemini ? "₹" : "$"}{r.currentSpend}
                    </p>
                  </div>

                  {/* RESTORED WARNINGS & BREAKDOWNS */}
                  {r.warning && (
                    <div className="mb-4 bg-red-900/30 text-red-400 border border-red-900/40 text-[11px] px-3 py-2 rounded-xl font-bold uppercase tracking-tight">
                      ⚠️ {r.warning}
                    </div>
                  )}

                  <div className="space-y-4 mt-6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Plan Tier</p>
                      <select 
                        value={configs[i].plan}
                        onChange={(e) => update(i, { plan: e.target.value })}
                        className="w-full bg-[#020617] text-sm text-slate-200 font-bold p-3 rounded-xl border border-slate-800 outline-none cursor-pointer"
                      >
                        {plans.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Total Seats</p>
                      <div className="flex items-center gap-4">
                        <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="w-12 h-12 bg-[#020617] rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors font-bold text-xl text-slate-400">-</button>
                        <span className="flex-1 text-center font-black text-2xl font-mono text-white">{configs[i].seats}</span>
                        <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="w-12 h-12 bg-[#020617] rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors font-bold text-xl text-slate-400">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {r.totalSavings > 0 && (
                   <div className="mt-6 pt-6 border-t border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-green-400 font-black uppercase tracking-widest">Savings Potential</span>
                        <span className="text-green-400 font-mono font-bold text-lg">+{isGemini ? "₹" : "$"}{r.totalSavings}</span>
                      </div>
                      {r.breakdown?.map((b, idx) => (
                        <p key={idx} className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="w-1 h-1 bg-slate-600 rounded-full" />
                          {b.type === "ghost_seats" ? "Optimize seat allocation" : "Annual billing discount"}
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
