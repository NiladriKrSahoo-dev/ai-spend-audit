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
      try { setConfigs(JSON.parse(saved)); } catch (e) { console.error("Cache clear"); }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ 
            role: "user", 
            content: `Audit: Saving $${totals.savings} on $${totals.current} spend. Main waste: ${topTool.toolName}. 3 sentence summary.` 
          }] 
        }),
      });

      if (!res.ok) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // Clean Vercel stream markers (0:"...")
        const cleanChunk = chunk.replace(/[0-9]:"([^"]+)"/g, "$1").replace(/\\n/g, "\n").replace(/"/g, "");
        setAiResponse(prev => prev + cleanChunk);
      }
    } catch (err) {
      setAiResponse("⚠️ Connection error. Please check your API key in Vercel.");
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="p-6 border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-2 font-bold text-xl uppercase tracking-tighter">
          <div className="bg-blue-600 text-white w-8 h-8 rounded flex items-center justify-center italic">C</div>
          Credex Audit
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            AI Spend <span className="text-blue-600">Optimized.</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-[2rem] border shadow-xl items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Savings</p>
              <p className="text-5xl font-black text-green-500 tracking-tighter">${totals.savings}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Budget</p>
              <p className="text-3xl font-bold tracking-tight">${totals.current}</p>
            </div>
            <button 
              onClick={handleGetAdvice}
              disabled={isAiLoading || totals.savings === 0}
              className="bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all disabled:opacity-20 shadow-lg"
            >
              {isAiLoading ? "Analyzing..." : "Generate AI Report"}
            </button>
          </div>

          <AnimatePresence>
            {aiResponse && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-6 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 font-medium leading-relaxed">
                {aiResponse}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((t, i) => (
            <div key={t.name} className="bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="mb-6 flex justify-between items-start">
                <h3 className="font-bold text-xl">{t.name}</h3>
                <span className="text-slate-400 font-bold">${results[i].currentSpend}</span>
              </div>
              <div className="space-y-4">
                <select 
                  value={configs[i].plan} 
                  onChange={e => update(i, { plan: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-sm outline-none"
                >
                  {getPlansForTool(t.name).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="flex items-center gap-3">
                  <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="w-10 h-10 bg-slate-100 rounded-lg font-bold hover:bg-slate-200">-</button>
                  <span className="flex-1 text-center font-black">{configs[i].seats}</span>
                  <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="w-10 h-10 bg-slate-100 rounded-lg font-bold hover:bg-slate-200">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
