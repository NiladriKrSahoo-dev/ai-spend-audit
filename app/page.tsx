// @ts-nocheck
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
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
    const current = results.reduce((acc, r) => acc + (r.currentSpend || 0), 0);
    const savings = results.reduce((acc, r) => acc + (r.totalSavings || 0), 0);
    return { current, savings };
  }, [results]);

  const handleGetAdvice = async () => {
    setIsAiLoading(true);
    setAiResponse("");

    const topWaste = [...results].sort((a, b) => b.totalSavings - a.totalSavings)[0];
    const prompt = `Analyze my AI spend audit. I can save $${totals.savings} per month. My current spend is $${totals.current}. The biggest waste is from ${topWaste?.toolName || "General"}. Give me a 3-sentence executive summary.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      if (!response.ok) throw new Error("API Connection Failed");

      // Simplified: Just get the full text back
      const rawText = await response.text();
      // Cleans up the Vercel stream markers if they exist
      const cleanText = rawText.replace(/[0-9]:"([^"]+)"/g, "$1").replace(/\\n/g, " ");
      setAiResponse(cleanText.trim());
      
    } catch (err) {
      setAiResponse("⚠️ Analysis failed. Ensure your Gemini API Key is set in Vercel.");
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <nav className="px-10 py-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter max-w-6xl mx-auto">
           <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white">$</div>
           Credex Audit
        </div>
      </nav>

      <main className="px-6 lg:px-10 pb-24 pt-12 max-w-6xl mx-auto">
        <header className="mb-16">
          <h1 className="text-6xl font-black tracking-tighter mb-8 leading-tight">
            SaaS bloat <span className="text-blue-600 italic">eliminated.</span>
          </h1>
          
          <div className="flex flex-col md:flex-row gap-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl items-center">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Potential Savings</p>
              <p className="text-6xl font-black text-green-500 tracking-tighter">${totals.savings}</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Current Spend</p>
              <p className="text-4xl font-bold tracking-tight text-gray-900">${totals.current}</p>
            </div>
            <button 
              onClick={handleGetAdvice}
              disabled={isAiLoading || totals.savings === 0}
              className="bg-black text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-20 active:scale-95"
            >
              {isAiLoading ? "Analyzing..." : "Get AI Report"}
            </button>
          </div>

          <AnimatePresence>
            {aiResponse && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-8 p-8 bg-blue-50 border border-blue-100 rounded-[2rem] text-blue-900 font-medium leading-relaxed shadow-inner">
                {aiResponse}
              </motion.div>
            )}
          </AnimatePresence>
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
    <div className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-sm hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-bold tracking-tight">{meta.name}</h3>
        <span className="font-bold text-gray-400 font-mono">${result.currentSpend}</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Plan Tier</label>
          <select 
            value={config.plan} 
            onChange={(e) => onUpdate({ plan: e.target.value })}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-sm outline-none cursor-pointer"
          >
            {plans.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Seats</label>
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
