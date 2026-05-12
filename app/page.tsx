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
      setAiResponse("⚠️ Error: Could not connect to the engine.");
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
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] font-sans selection:bg-black selection:text-white pb-20">
      
      {/* Minimalist Top Nav */}
      <nav className="pt-6 pb-4 px-8 max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#111111] rounded-sm"></div>
          <span className="font-bold text-[15px] tracking-tight">StackTrim</span>
        </div>
        <div className="flex gap-4 text-sm font-medium text-[#666666]">
          <span className="cursor-pointer hover:text-black transition-colors">Dashboard</span>
          <span className="cursor-pointer hover:text-black transition-colors">Settings</span>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-8 py-8">
        
        {/* Main Dashboard Widget */}
        <header className="mb-12">
          <div className="bg-white rounded-[24px] border border-[#E5E5E5] p-10 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm">
             
             <div className="flex flex-col md:flex-row gap-12 md:gap-24 w-full items-start md:items-center">
               
               {/* Savings Metric */}
               <div>
                 <p className="text-[13px] font-semibold text-[#666666] mb-2 flex items-center gap-2">
                    Potential Savings
                    <span className="bg-[#F0F0F0] text-[#111111] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Monthly</span>
                 </p>
                 <p className="text-6xl md:text-7xl font-bold tracking-tighter leading-none text-[#111111]">
                   ${totals.savings.toLocaleString()}
                 </p>
               </div>

               {/* Current Spend Metric */}
               <div className="hidden md:block w-px h-20 bg-[#E5E5E5]"></div>
               
               <div>
                 <p className="text-[13px] font-semibold text-[#666666] mb-2">Current Spend</p>
                 <p className="text-3xl font-semibold tracking-tight text-[#111111]">
                   ${totals.current.toLocaleString()}
                 </p>
               </div>

               {/* Action Button */}
               <div className="ml-auto mt-6 md:mt-0 w-full md:w-auto">
                 <button 
                    onClick={handleGetAdvice}
                    disabled={isAiLoading || totals.savings === 0}
                    className="w-full md:w-auto bg-[#111111] text-white px-8 py-4 rounded-full font-semibold text-[14px] hover:bg-[#333333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                   {isAiLoading ? "Analyzing Data..." : "Generate AI Report"}
                 </button>
               </div>
             </div>
          </div>
          
          <AnimatePresence>
            {aiResponse && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-8 bg-white border border-[#E5E5E5] rounded-[24px] text-left shadow-sm flex gap-6"
              >
                <div className="w-10 h-10 rounded-full bg-[#F0F0F0] flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <p className="text-[#111111] text-[15px] leading-relaxed font-medium">
                  {aiResponse}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#111111] tracking-tight">Active Subscriptions</h2>
          <span className="text-[#666666] text-sm font-medium">{TOOLS.length} Tools</span>
        </div>

        {/* Tool Grid (Like the Dribbble Kanban Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((t, i) => {
            const r = results[i];
            const plans = getPlansForTool(t.name);
            const isGemini = t.name === "Gemini";
            const hasSavings = r.totalSavings > 0;
            
            return (
              <div key={t.name} className="bg-white p-6 rounded-[20px] border border-[#E5E5E5] hover:shadow-md transition-shadow flex flex-col justify-between group">
                
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-[17px] text-[#111111] tracking-tight">{t.name}</h3>
                    <p className="font-medium text-[#666666] text-[15px]">
                      {isGemini ? "₹" : "$"}{r.currentSpend}
                    </p>
                  </div>

                  {r.warning && (
                    <div className="mb-5 bg-[#F9F9F9] border border-[#EEEEEE] text-[#111111] text-[11px] px-3 py-1.5 rounded-md font-semibold inline-flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#111111] rounded-full" />
                      {r.warning}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-[#F0F0F0] pb-2">
                      <p className="text-[12px] text-[#888888] font-medium">Plan Tier</p>
                      <select 
                        value={configs[i].plan}
                        onChange={(e) => update(i, { plan: e.target.value })}
                        className="bg-transparent text-[13px] text-[#111111] font-semibold outline-none cursor-pointer text-right appearance-none"
                      >
                        {plans.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <p className="text-[12px] text-[#888888] font-medium">Allocated Seats</p>
                      <div className="flex items-center gap-3 bg-[#F9F9F9] px-2 py-1 rounded-lg border border-[#E5E5E5]">
                        <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="w-6 h-6 flex items-center justify-center text-[#666666] hover:text-[#111111] rounded font-medium text-lg transition-colors">−</button>
                        <span className="w-6 text-center font-semibold text-[#111111] text-[14px]">{configs[i].seats}</span>
                        <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="w-6 h-6 flex items-center justify-center text-[#666666] hover:text-[#111111] rounded font-medium text-lg transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {hasSavings && (
                   <div className="mt-5 pt-5 border-t border-[#F0F0F0]">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-[#666666] font-medium">Optimized Savings</span>
                        <span className="text-[#111111] font-bold text-[14px]">+{isGemini ? "₹" : "$"}{r.totalSavings}</span>
                      </div>
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
