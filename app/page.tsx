"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "ai/react"; 
import {
  calculateSavings,
  PRICING_DB,
  getPlansForTool,
} from "../src/lib/audit/auditEngine"; // ✅ This path is now 100% correct for your folder structure

const SPRING = { type: "spring" as const, stiffness: 400, damping: 28 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 300, damping: 24 };

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

  const handleGetAdvice = () => {
    const sortedResults = [...results].sort((a, b) => b.totalSavings - a.totalSavings);
    const topWaste = sortedResults[0];

    append({
      role: "user",
      content: "Analyze my audit results.",
    }, {
      body: {
        totalSavings: totals.savings,
        topWasteTool: topWaste.totalSavings > 0 ? topWaste.toolName : "General AI Overhead",
        currentSpend: totals.current
      }
    });
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("auditConfigs_v2");
    if (saved) {
      try { setConfigs(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const results = useMemo(
    () => TOOLS.map((t, i) => calculateSavings(t.name, configs[i].seats, configs[i].plan, "monthly")),
    [configs],
  );

  const totals = useMemo(() => {
    let cur = 0, opt = 0, withSavings = 0, totalSeats = 0;
    results.forEach((r, i) => {
      if (r.currency === "$") { cur += r.currentSpend; opt += r.suggestedSpend; }
      if (r.totalSavings > 0) withSavings++;
      totalSeats += configs[i].seats;
    });
    return { current: cur, optimised: opt, savings: cur - opt, annual: (cur - opt) * 12, withSavings, totalSeats };
  }, [results]);

  const update = useCallback((i: number, patch: Partial<ToolConfig>) => {
    setConfigs((prev) => {
      const next = prev.map((c, j) => (j === i ? { ...c, ...patch } : c));
      localStorage.setItem("auditConfigs_v2", JSON.stringify(next));
      return next;
    });
  }, []);

  const insights = useMemo(() => {
    const arr: { tool: string; text: string; type: "ghost" | "annual" }[] = [];
    results.forEach((r, i) => {
      r.breakdown.forEach((b) => {
        if (b.type === "ghost_seats") arr.push({ tool: TOOLS[i].name, text: `${b.description.split(".")[0]}.`, type: "ghost" as const });
        if (b.type === "annual_switch") arr.push({ tool: TOOLS[i].name, text: `Switch to annual billing to save ${r.currency}${b.monthlySavings}/mo.`, type: "annual" as const });
      });
    });
    return arr;
  }, [results]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative bg-slate-950 text-white p-8">
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4">CREDEX AI AUDIT</h1>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
             <p className="text-sm uppercase tracking-widest text-slate-400 mb-2">Potential Savings</p>
             <p className="text-5xl font-mono text-green-400">${totals.savings.toLocaleString()}/mo</p>
             
             <button 
                onClick={handleGetAdvice}
                disabled={isLoading || totals.savings === 0}
                className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-slate-200 transition-colors disabled:opacity-30"
             >
               {isLoading ? "Consulting Advisor..." : "Get Strategic Advice"}
             </button>
          </div>
          
          {messages.filter(m => m.role === 'assistant').length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-blue-900/20 border border-blue-800 rounded-2xl text-left italic text-blue-200"
            >
              {messages.filter(m => m.role === 'assistant').map(m => (
                <p key={m.id}>{m.content}</p>
              ))}
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((t, i) => (
            <div key={t.name} className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-xl">{t.name}</h3>
              <div className="mt-4 flex items-center justify-between">
                <span>Seats: {configs[i].seats}</span>
                <div className="flex gap-2">
                  <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="bg-slate-800 w-8 h-8 rounded">-</button>
                  <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="bg-slate-800 w-8 h-8 rounded">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
