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
  const [configs, setConfigs] = useState(TOOLS.map((t) => ({ plan: t.defaultPlan, seats: t.defaultSeats })));
  
  // ✅ Manual AI State
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const results = useMemo(() => TOOLS.map((t, i) => {
    try {
      return calculateSavings(t.name, configs[i].seats, configs[i].plan, "monthly");
    } catch (e) {
      return { currentSpend: 0, totalSavings: 0, breakdown: [], warning: "Error" };
    }
  }), [configs]);

  const totals = useMemo(() => {
    let cur = 0;
    results.forEach((r) => { cur += r.currentSpend || 0; });
    const savings = results.reduce((acc, r) => acc + (r.totalSavings || 0), 0);
    return { current: cur, savings };
  }, [results]);

  // ✅ DIRECT API CALL (Bypasses "append is not a function")
  const handleGetAdvice = async () => {
    setIsAiLoading(true);
    setAiResponse("");

    const topWaste = [...results].sort((a, b) => b.totalSavings - a.totalSavings)[0];
    const prompt = `Analyze my AI spend audit. I can save $${totals.savings} per month. My current spend is $${totals.current}. The biggest waste is from ${topWaste?.toolName || "General"}. Give me a 3-sentence executive summary.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      if (!response.ok) throw new Error("API Limit or Key Error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        // Standard Vercel stream filtering (removes the "0:" markers)
        const cleanText = text.replace(/[0-9]:"/g, "").replace(/"/g, "").replace(/\\n/g, "\n");
        setAiResponse((prev) => prev + cleanText);
      }
    } catch (err) {
      setAiResponse("⚠️ Error: Check your Gemini API key in Vercel settings.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("auditConfigs_v3");
    if (saved) try { setConfigs(JSON.parse(saved)); } catch (e) {}
  }, []);

  const update = (i, patch) => {
    setConfigs((prev) => {
      const next = prev.map((c, j) => (j === i ? { ...c, ...patch } : c));
      localStorage.setItem("auditConfigs_v3", JSON.stringify(next));
      return next;
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none hero-grid" />
      
      <nav className="relative z-50 flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
           <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white">$</div>
           Credex Audit
        </div>
      </nav>

      <main className="relative z-10 px-6 lg:px-10 pb-24 pt-8 max-w-6xl mx-auto">
        <header className="mb-16">
          <motion.h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
            SaaS bloat <span className="text-blue-600">eliminated.</span>
          </motion.h1>
          
          <div className="flex flex-col md:flex-row gap-8 bg-white p-10 rounded-[2rem] border border-gray-200 shadow-xl items-center">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Potential Savings</p>
              <p className="text-6xl font-black text-green-500 tracking-tighter">${totals.savings}</p>
            </div>
            <div className="h-16 w-px bg-gray-100 hidden md:block" />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Current Spend</p>
              <p className="text-4xl font-bold tracking-tight text-gray-900">${totals.current}</p>
            </div>
            <button 
              onClick={handleGetAdvice}
              disabled={isAiLoading || totals.savings === 0}
              className="bg-black text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-20"
            >
              {isAiLoading ? "Analyzing..." : "Get AI Report"}
            </button>
          </div>

          {aiResponse && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-8 bg-blue-50 border border-blue-100 rounded-[2rem] text-blue-900 font-medium leading-relaxed">
              {aiResponse}
            </motion.div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((meta, i) => (
            <ToolCard key={meta.name} meta={meta} config={configs[i]} result={results[i]} onUpdate={(patch) => update(i, patch)} />
          ))}
        </div>
      </main>
    </div>
  );
}

function ToolCard({ meta, config, result, onUpdate }) {
  const plans = getPlansForTool(meta.name);
  return (
    <div className="bg-white border border-gray-200 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-bold tracking-tight">{meta.name}</h3>
        <span className="font-bold text-gray-400">${result.currentSpend}</span>
      </div>
      
      {result.warning && <div className="mb-4 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg">⚠️ {result.warning}</div>}

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Plan Tier</label>
          <select 
            value={config.plan} 
            onChange={(e) => onUpdate({ plan: e.target.value })}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-sm outline-none"
          >
            {plans.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Seats</label>
          <div className="flex items-center gap-3">
            <button onClick={() => onUpdate({ seats: Math.max(0, config.seats - 1) })} className="w-12 h-12 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors">-</button>
            <div className="flex-1 text-center font-black text-lg">{config.seats}</div>
            <button onClick={() => onUpdate({ seats: config.seats + 1 })} className="w-12 h-12 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors">+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
