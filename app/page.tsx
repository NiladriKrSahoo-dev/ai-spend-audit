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
            content: `Analyze this AI audit. Saving $${totals.savings} on $${totals.current} spend. Main waste: ${topTool?.toolName || 'General'}. Write a 3-sentence summary.` 
          }] 
        }),
      });

      const text = await res.text();
      setAiResponse(text);
    } catch (err) {
      setAiResponse("⚠️ AI Error: Could not connect to the engine.");
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-violet-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">S</div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">StackTrim</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero & Audit Summary */}
        <header className="mb-16">
          <div className="bg-white border border-slate-100 p-8 md:p-12 rounded-[2rem] shadow-2xl shadow-slate-200/50 relative overflow-hidden">
             
             {/* Vibrant Background Accents */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-violet-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

             <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
               <div>
                 <p className="text-xs uppercase font-extrabold text-slate-400 mb-2 tracking-widest">Total Monthly Savings</p>
                 <p className="text-6xl md:text-8xl font-black font-mono tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-green-400 drop-shadow-sm">
                   ${totals.savings.toLocaleString()}
                 </p>
                 <div className="mt-6 flex items-center gap-3">
                   <p className="text-sm font-semibold text-slate-600 bg-slate-100 inline-flex items-center px-4 py-2 rounded-lg border border-slate-200">
                     Current Spend: <span className="font-mono font-bold text-slate-900 ml-2">${totals.current.toLocaleString()}</span>
                   </p>
                 </div>
               </div>

               <div className="flex md:justify-end">
                 <button 
                    onClick={handleGetAdvice}
                    disabled={isAiLoading || totals.savings === 0}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-violet-600 text-white px-10 py-5 rounded-2xl font-black text-lg tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:hover:scale-100 shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3"
                 >
                   {isAiLoading ? (
                     <>
                       <span className="animate-pulse flex space-x-1.5">
                         <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                         <span className="w-2.5 h-2.5 bg-white rounded-full animation-delay-200"></span>
                         <span className="w-2.5 h-2.5 bg-white rounded-full animation-delay-400"></span>
                       </span>
                       Consulting AI
                     </>
                   ) : "Generate AI Strategy"}
                 </button>
               </div>
             </div>
          </div>
          
          <AnimatePresence>
            {aiResponse && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }} 
                animate={{ opacity: 1, height: "auto", y: 0 }}
                className="mt-6 p-6 md:p-8 bg-blue-50 border border-blue-100 rounded-3xl text-left shadow-lg shadow-blue-100/50"
              >
                <div className="flex items-start gap-4">
                  <div className="text-blue-600 mt-1 bg-blue-100 p-2 rounded-full">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <p className="text-blue-900 text-[15px] md:text-[17px] leading-relaxed font-medium">
                    {aiResponse}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Tools Grid */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">License Inventory</h2>
          <div className="h-px bg-slate-200 flex-1 ml-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((t, i) => {
            const r = results[i];
            const plans = getPlansForTool(t.name);
            const isGemini = t.name === "Gemini";
            const hasSavings = r.totalSavings > 0;
            
            return (
              <div key={t.name} className={`bg-white p-7 rounded-3xl border-2 flex flex-col justify-between transition-all duration-300 ${hasSavings ? 'border-blue-200 shadow-xl shadow-blue-900/5 hover:border-blue-400 hover:-translate-y-1' : 'border-slate-100 shadow-md'}`}>
                
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-slate-900 tracking-tight">{t.name}</h3>
                    <p className="font-mono text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      {isGemini ? "₹" : "$"}{r.currentSpend}
                    </p>
                  </div>

                  {r.warning && (
                    <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 text-[11px] px-3 py-2 rounded-lg uppercase font-bold tracking-wider inline-flex items-center gap-2 shadow-sm">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      {r.warning}
                    </div>
                  )}

                  <div className="space-y-4 mt-6">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest px-2 mb-1">Plan Tier</p>
                      <select 
                        value={configs[i].plan}
                        onChange={(e) => update(i, { plan: e.target.value })}
                        className="w-full bg-transparent text-sm text-slate-900 font-bold px-2 outline-none cursor-pointer appearance-none"
                      >
                        {plans.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-2">Seats</p>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md font-bold transition-colors">−</button>
                        <span className="w-10 text-center font-black font-mono text-slate-900 text-lg">{configs[i].seats}</span>
                        <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md font-bold transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {hasSavings && (
                   <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Optimized Savings</span>
                        <span className="text-emerald-500 font-mono font-black text-lg">+{isGemini ? "₹" : "$"}{r.totalSavings}</span>
                      </div>
                      {r.breakdown?.map((b, idx) => (
                        <p key={idx} className="text-[12px] text-slate-500 font-medium flex items-center gap-2 mt-1">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          {b.type === "ghost_seats" ? "Optimize unused seats" : "Apply annual discount"}
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
