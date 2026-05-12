// @ts-nocheck
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateSavings, getPlansForTool } from "../src/lib/audit/auditEngine";

// REALISTIC DEFAULT DATA: Sets the stage for a compelling initial graph
const TOOLS = [
  { name: "Cursor",         defaultPlan: "Teams",    defaultSeats: 12 },
  { name: "ChatGPT",        defaultPlan: "Business", defaultSeats: 45 },
  { name: "Claude",         defaultPlan: "Team",     defaultSeats: 8  },
  { name: "GitHub Copilot", defaultPlan: "Business", defaultSeats: 30 },
  { name: "Gemini",         defaultPlan: "Pro",      defaultSeats: 1  }, // Fixed: Single user plan default
  { name: "V0.dev",         defaultPlan: "Team",     defaultSeats: 5  },
];

// DYNAMIC PLAN CONTEXT: Explains the billing structure instantly
const getPlanContext = (planName) => {
  const p = planName.toLowerCase();
  if (p.includes("free") || p.includes("hobby")) return "Free Tier";
  if (p === "pro" || p === "plus" || p === "individual" || p === "go" || p === "premium" || p === "ultra") return "Single User Plan";
  if (p.includes("team") || p.includes("business") || p.includes("enterprise")) return "Multi-Seat Plan";
  return "Standard tier";
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [configs, setConfigs] = useState(TOOLS.map(t => ({ plan: t.defaultPlan, seats: t.defaultSeats })));
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  useEffect(() => {
    setMounted(true);
    // Bumping to v5 to clear out any old broken local data
    const saved = localStorage.getItem("auditConfigs_v5");
    if (saved) {
      try { setConfigs(JSON.parse(saved)); } catch (e) {}
    } else {
      setShowTour(true);
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

  const optimizedSpend = totals.current - totals.savings;
  const optimizedPercent = totals.current > 0 ? (optimizedSpend / totals.current) * 100 : 0;
  const wastedPercent = totals.current > 0 ? (totals.savings / totals.current) * 100 : 0;

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

  // 🚀 THE PRODUCTION LOGIC FIX: Enforces strict seat rules and minimums
  const update = (i, patch) => {
    let nextConfigs = [...configs];
    let toolConfig = { ...nextConfigs[i], ...patch };
    const toolName = TOOLS[i].name;

    const singleSeatPlans = ["Hobby", "Free", "Pro", "Individual", "Plus", "Go", "Premium", "Ultra"];

    // RULE 1: If switching to a single-user plan, hard cap seats at 1
    if (singleSeatPlans.includes(toolConfig.plan)) {
      if (toolConfig.seats > 1) toolConfig.seats = 1;
    }

    // RULE 2: Enforce SaaS Plan Minimums (e.g., Claude Team requires 5)
    if (patch.seats !== undefined) {
      if (toolName === "Claude" && toolConfig.plan === "Team") {
         // If dropping below minimum 5, jump straight to 0 (canceled)
         if (configs[i].seats === 5 && patch.seats === 4) toolConfig.seats = 0;
         else if (patch.seats > 0 && patch.seats < 5) toolConfig.seats = 5;
      }
      if (toolName === "ChatGPT" && toolConfig.plan === "Business") {
         // Minimum 2
         if (configs[i].seats === 2 && patch.seats === 1) toolConfig.seats = 0;
         else if (patch.seats > 0 && patch.seats < 2) toolConfig.seats = 2;
      }
    }

    nextConfigs[i] = toolConfig;
    setConfigs(nextConfigs);
    localStorage.setItem("auditConfigs_v5", JSON.stringify(nextConfigs));
  };

  const closeTour = () => {
    setShowTour(false);
    localStorage.setItem("auditConfigs_v5", JSON.stringify(configs));
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] font-sans selection:bg-black selection:text-white pb-20">
      
      {/* THE TOUR MODAL */}
      <AnimatePresence>
        {showTour && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[24px] shadow-2xl p-10 max-w-md w-full relative border border-[#E5E5E5]"
            >
              {tourStep === 1 && (
                <div>
                  <div className="w-12 h-12 bg-[#F0F0F0] rounded-full flex items-center justify-center mb-6">👋</div>
                  <h2 className="text-2xl font-bold mb-3 tracking-tight">Welcome to StackTrim</h2>
                  <p className="text-[#666666] leading-relaxed mb-8 text-[15px]">This tool audits your company's AI subscriptions using verified 2026 pricing to find wasted spend and ghost seats.</p>
                </div>
              )}
              {tourStep === 2 && (
                <div>
                  <div className="w-12 h-12 bg-[#F0F0F0] rounded-full flex items-center justify-center mb-6">⚙️</div>
                  <h2 className="text-2xl font-bold mb-3 tracking-tight">Smart Tier Logic</h2>
                  <p className="text-[#666666] leading-relaxed mb-8 text-[15px]">Our UI enforces real-world constraints. Try adding 10 seats to a "Free" tier, or watch it enforce Claude's 5-seat Team minimum automatically.</p>
                </div>
              )}
              {tourStep === 3 && (
                <div>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">✨</div>
                  <h2 className="text-2xl font-bold mb-3 tracking-tight">Get AI Insights</h2>
                  <p className="text-[#666666] leading-relaxed mb-8 text-[15px]">Once your stack is dialed in, click the black <b>Generate AI Report</b> button. Our engine will formulate a strategic summary for your CFO.</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-[#F0F0F0]">
                <div className="flex gap-2">
                  <div className={`w-2 h-2 rounded-full ${tourStep === 1 ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`} />
                  <div className={`w-2 h-2 rounded-full ${tourStep === 2 ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`} />
                  <div className={`w-2 h-2 rounded-full ${tourStep === 3 ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`} />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeTour} className="text-[14px] font-semibold text-[#888888] hover:text-[#111111] px-4 py-2">Skip</button>
                  {tourStep < 3 ? (
                    <button onClick={() => setTourStep(prev => prev + 1)} className="bg-[#111111] text-white px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-[#333333] transition-colors">Next</button>
                  ) : (
                    <button onClick={closeTour} className="bg-emerald-500 text-white px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-emerald-600 transition-colors">Start Auditing</button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="pt-6 pb-4 px-8 max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#111111] rounded-sm"></div>
          <span className="font-bold text-[15px] tracking-tight">StackTrim</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-[#666666]">
          <span className="cursor-pointer hover:text-black transition-colors">Dashboard</span>
          <button onClick={() => { setTourStep(1); setShowTour(true); }} className="cursor-pointer hover:text-black transition-colors flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Tour
          </button>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-8 py-8">
        
        <header className="mb-12">
          <div className="bg-white rounded-[24px] border border-[#E5E5E5] p-10 shadow-sm">
             <div className="flex flex-col md:flex-row gap-12 md:gap-24 w-full items-start md:items-center justify-between">
               <div>
                 <p className="text-[13px] font-semibold text-[#666666] mb-2 flex items-center gap-2">
                    Potential Savings
                    <span className="bg-[#F0F0F0] text-[#111111] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Monthly</span>
                 </p>
                 <p className="text-6xl md:text-7xl font-bold tracking-tighter leading-none text-[#111111]">
                   ${totals.savings.toLocaleString()}
                 </p>
               </div>

               <div className="hidden md:block w-px h-20 bg-[#E5E5E5]"></div>
               
               <div>
                 <p className="text-[13px] font-semibold text-[#666666] mb-2">Current Spend</p>
                 <p className="text-3xl font-semibold tracking-tight text-[#111111]">
                   ${totals.current.toLocaleString()}
                 </p>
               </div>

               <div className="ml-auto mt-6 md:mt-0 w-full md:w-auto">
                 <button 
                    onClick={handleGetAdvice}
                    disabled={isAiLoading || totals.savings === 0}
                    className="w-full md:w-auto bg-[#111111] text-white px-8 py-4 rounded-full font-semibold text-[14px] hover:bg-[#333333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/5"
                 >
                   {isAiLoading ? "Analyzing Data..." : "Generate AI Report"}
                 </button>
               </div>
             </div>

             <div className="mt-10 pt-8 border-t border-[#E5E5E5]">
               <h3 className="text-[13px] font-semibold text-[#666666] mb-4">Spend Allocation (Optimized vs Wasted)</h3>
               <div className="h-4 w-full bg-[#F0F0F0] rounded-full overflow-hidden flex">
                 <motion.div initial={{ width: 0 }} animate={{ width: `${optimizedPercent}%` }} transition={{ duration: 0.8 }} className="h-full bg-[#111111]" />
                 <motion.div initial={{ width: 0 }} animate={{ width: `${wastedPercent}%` }} transition={{ duration: 0.8 }} className="h-full bg-emerald-500" />
               </div>
               <div className="flex justify-between items-center text-[12px] mt-3 font-medium">
                 <span className="text-[#111111] flex items-center gap-1.5"><span className="w-2 h-2 bg-[#111111] rounded-sm"></span> Optimized: ${optimizedSpend.toLocaleString()}</span>
                 <span className="text-emerald-600 flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-sm"></span> Potential Savings: ${totals.savings.toLocaleString()}</span>
               </div>
             </div>
          </div>
          
          <AnimatePresence>
            {aiResponse && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
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

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#111111] tracking-tight">Active Subscriptions</h2>
          <span className="text-[#666666] text-sm font-medium">{TOOLS.length} Tools</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((t, i) => {
            const r = results[i];
            const plans = getPlansForTool(t.name);
            const isGemini = t.name === "Gemini";
            const hasSavings = r.totalSavings > 0;
            const planContext = getPlanContext(configs[i].plan);
            
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
                    <div className="mb-5 bg-[#FFF4F4] border border-[#FFE5E5] text-[#D92D20] text-[11px] px-3 py-2 rounded-md font-bold inline-flex items-center gap-2 shadow-sm w-full">
                      <span className="w-1.5 h-1.5 bg-[#D92D20] rounded-full flex-shrink-0 animate-pulse" />
                      {r.warning.includes("plan") ? "Incompatible Plan Combination" : r.warning}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="border-b border-[#F0F0F0] pb-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[12px] text-[#888888] font-medium">Plan Tier</p>
                        
                        {/* 🚀 SAFARI FIX: Clean native select. No custom overlapping SVG. */}
                        <select 
                          value={configs[i].plan}
                          onChange={(e) => update(i, { plan: e.target.value })}
                          className="bg-transparent text-[13px] text-[#111111] font-semibold outline-none cursor-pointer text-right min-w-[100px]"
                        >
                          {plans.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <p className="text-[9px] text-[#AAAAAA] text-right uppercase tracking-wider font-semibold">{planContext}</p>
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
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[12px] text-[#666666] font-medium">Optimized Savings</span>
                        <span className="text-emerald-600 font-bold text-[14px]">+{isGemini ? "₹" : "$"}{r.totalSavings}</span>
                      </div>
                      
                      {r.breakdown?.map((b, idx) => (
                         <p key={idx} className="text-[11px] text-[#D92D20] font-bold flex items-center gap-1.5 mt-1 bg-[#FFF4F4] px-2 py-1 rounded">
                           <span className="w-1 h-1 bg-[#D92D20] rounded-full" />
                           {b.type === "ghost_seats" ? "Ghost seats detected (Downgrade)" : "Incompatible billing (Switch to Annual)"}
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
