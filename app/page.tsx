// @ts-nocheck
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion"; 
import { useChat } from "@ai-sdk/react"; 
import { calculateSavings, getPlansForTool } from "../src/lib/audit/auditEngine"; 

interface ToolMeta { name: string; defaultPlan: string; defaultSeats: number; }
interface ToolConfig { plan: string; seats: number; }
const TOOLS: ToolMeta[] = [
  { name: "Cursor",         defaultPlan: "Teams",    defaultSeats: 10 },
  { name: "ChatGPT",        defaultPlan: "Business", defaultSeats: 10 },
  { name: "Claude",         defaultPlan: "Team",     defaultSeats: 8  },
  { name: "GitHub Copilot", defaultPlan: "Business", defaultSeats: 10 },
  { name: "Gemini",         defaultPlan: "Pro",      defaultSeats: 5  },
  { name: "V0.dev",         defaultPlan: "Team",     defaultSeats: 5  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [configs, setConfigs] = useState<ToolConfig[]>(
    TOOLS.map((t) => ({ plan: t.defaultPlan, seats: t.defaultSeats })),
  );

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
  });

  const results = useMemo(() => TOOLS.map((t, i) => {
    try {
      return calculateSavings(t.name, configs[i].seats, configs[i].plan, "monthly");
    } catch (e) {
      return { currentSpend: 0, suggestedSpend: 0, totalSavings: 0, warning: "Plan calculation error." };
    }
  }), [configs]);

  const totals = useMemo(() => {
    let cur = 0, opt = 0;
    results.forEach((r) => {
      cur += r.currentSpend || 0; 
      opt += r.suggestedSpend || 0; 
    });
    return { current: cur, optimised: opt, savings: cur - opt };
  }, [results]);

  const handleGetAdvice = () => {
    const sortedResults = [...results].sort((a, b) => (b.totalSavings || 0) - (a.totalSavings || 0));
    const topWaste = sortedResults[0];
    const biggestWasteName = topWaste && topWaste.totalSavings > 0 ? topWaste.toolName : "General Overhead";

    append({
      role: "user",
      content: `Analyze my AI spend audit. I can save $${totals.savings} per month. My current spend is $${totals.current}. The biggest waste is from ${biggestWasteName}. Give me a short, punchy 3-sentence executive summary on how to optimize this.`
    });
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("auditConfigs_v2");
    if (saved) { try { setConfigs(JSON.parse(saved)); } catch (e) {} }
  }, []);

  const update = useCallback((i: number, patch: Partial<ToolConfig>) => {
    setConfigs((prev) => {
      const next = prev.map((c, j) => (j === i ? { ...c, ...patch } : c));
      localStorage.setItem("auditConfigs_v2", JSON.stringify(next));
      return next;
    });
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <main className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-tighter mb-4 text-slate-100 uppercase">Credex AI Auditor</h1>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
             <p className="text-xs uppercase font-bold text-slate-500 mb-2">Monthly Potential Savings</p>
             <p className="text-6xl font-mono text-green-400 font-bold tracking-tight">${totals.savings.toLocaleString()}</p>
             <p className="text-sm text-slate-400 mt-2 font-medium">Total Current Spend: ${totals.current.toLocaleString()}</p>
             
             <button 
                onClick={handleGetAdvice}
                disabled={isLoading || totals.savings === 0}
                className="mt-8 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100"
             >
               {isLoading ? "Consulting Strategic AI..." : "Get Strategic Summary"}
             </button>
          </div>
          
          {messages.filter(m => m.role === 'assistant').length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left"
            >
              <p className="text-blue-300 italic text-sm leading-relaxed">
                {messages.filter(m => m.role === 'assistant').map(m => m.content).join('')}
              </p>
            </motion.div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOOLS.map((t, i) => {
            const r = results[i];
            const validPlans = typeof getPlansForTool === 'function' ? getPlansForTool(t.name) : [configs[i].plan];

            return (
            <div key={t.name} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-200">{t.name}</h3>
                  <p className="font-mono text-slate-400 font-bold">${r.currentSpend || 0}</p>
                </div>

                {r.warning && (
                  <div className="mb-4 bg-red-900/30 text-red-400 border border-red-900/50 text-xs px-3 py-2 rounded-lg font-medium">
                    ⚠️ {r.warning}
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500 uppercase font-bold">Plan</p>
                    <select 
                      value={configs[i].plan}
                      onChange={(e) => update(i, { plan: e.target.value })}
                      className="bg-slate-800 text-xs text-slate-300 rounded px-2 py-1 outline-none border border-slate-700"
                    >
                      {validPlans.map((plan: string) => (
                        <option key={plan} value={plan}>{plan}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500 uppercase font-bold">Seats</p>
                    <p className="text-sm font-bold">{configs[i].seats}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded-xl font-bold">-</button>
                <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded-xl font-bold">+</button>
              </div>
            </div>
          )})}
        </div>
      </main>
    </div>
  );
}
