// @ts-nocheck
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { calculateSavings, getPlansForTool } from "../src/lib/audit/auditEngine";

const SPRING_SOFT = { type: "spring" as const, stiffness: 300, damping: 24 };

interface ToolMeta { name: string; defaultPlan: string; defaultSeats: number; }
interface ToolConfig { plan: string; seats: number; }
const TOOLS: ToolMeta[] = [
  { name: "Cursor",         defaultPlan: "Teams",    defaultSeats: 0 },
  { name: "ChatGPT",        defaultPlan: "Business", defaultSeats: 0 },
  { name: "Claude",         defaultPlan: "Team",     defaultSeats: 0  },
  { name: "GitHub Copilot", defaultPlan: "Business", defaultSeats: 0 },
  { name: "Gemini",         defaultPlan: "Pro",      defaultSeats: 0  },
  { name: "V0.dev",         defaultPlan: "Team",     defaultSeats: 0  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [configs, setConfigs] = useState<ToolConfig[]>(
    TOOLS.map((t) => ({ plan: t.defaultPlan, seats: t.defaultSeats })),
  );

  // Extracting directly to ensure 'append' is captured correctly
  const chat = useChat({
    api: "/api/chat",
  });

  const messages = chat.messages || [];
  const isLoading = chat.isLoading || false;
  const append = chat.append;

  const results = useMemo(() => TOOLS.map((t, i) => {
    try {
      return calculateSavings(t.name, configs[i].seats, configs[i].plan, "monthly");
    } catch (e) {
      return { currentSpend: 0, suggestedSpend: 0, totalSavings: 0, breakdown: [], warning: "Plan calculation error." };
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
    if (typeof append !== 'function') {
      console.error("AI SDK 'append' is not a function yet.");
      return;
    }

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
    if (saved) {
      try { setConfigs(JSON.parse(saved)); } catch (e) {}
    }
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
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden selection:bg-accent/30 selection:text-white">
      <div className="hero-grid absolute inset-0 z-0 h-[80vh]" aria-hidden="true" />

      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a 3.5 3.5 0 0 0 0 -7M7 12H4" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Credex Audit</span>
        </div>
      </nav>

      <main className="relative z-10 px-6 lg:px-10 pb-24 pt-12">
        <div className="max-w-6xl mx-auto">
          <header className="mb-20">
            <motion.div className="max-w-3xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
                SaaS bloat <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-500">eliminated.</span>
              </h1>
              <p className="text-lg sm:text-xl text-secondary font-medium leading-relaxed max-w-2xl">
                Discover overlapping licenses, reclaim wasted spend, and optimize your team's AI tool stack in seconds.
              </p>
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm max-w-2xl mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_SOFT, delay: 0.15 }}>
              <div className="flex-1 w-full text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Current Spend</p>
                <p className="text-3xl md:text-4xl font-bold tracking-tight">${totals.current.toLocaleString()}<span className="text-base text-tertiary font-medium">/mo</span></p>
              </div>
              <div className="hidden sm:block w-px h-16 bg-border"></div>
              <div className="flex-1 w-full text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Potential Savings</p>
                <p className="text-4xl md:text-5xl font-black tracking-tight text-accent">${totals.savings.toLocaleString()}<span className="text-lg text-tertiary font-medium">/mo</span></p>
              </div>
              <div className="w-full sm:w-auto mt-4 sm:mt-0">
                <button
                  onClick={handleGetAdvice}
                  disabled={isLoading || totals.savings === 0}
                  className="w-full sm:w-auto bg-foreground text-background px-6 py-4 rounded-xl font-bold hover:scale-105 transition-transform active:scale-95 disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? "Analyzing..." : "Get AI Report"}
                </button>
              </div>
            </motion.div>

            {messages.filter((m: any) => m.role === 'assistant').length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-accent/10 border border-accent/20 rounded-2xl text-left max-w-2xl mx-auto"
              >
                <p className="text-accent italic text-sm leading-relaxed">
                  {messages.filter((m: any) => m.role === 'assistant').map((m: any) => m.content).join('')}
                </p>
              </motion.div>
            )}
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {TOOLS.map((meta, i) => (
              <ToolCard key={meta.name} meta={meta} config={configs[i]} result={results[i]} i={i} onUpdate={update} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ToolCard({ meta, config, result, i, onUpdate }: { meta: ToolMeta; config: ToolConfig; result: ReturnType<typeof calculateSavings>; i: number; onUpdate: (i: number, p: Partial<ToolConfig>) => void }) {
  const validPlans = typeof getPlansForTool === 'function' ? getPlansForTool(meta.name) : [config.plan];
  const cur = result.currency || "$";

  return (
    <motion.div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_SOFT, delay: i * 0.05 }}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{meta.name}</h2>
          <span className="text-lg font-black font-mono text-tertiary">{cur}{result.currentSpend || 0}</span>
        </div>

        {result.warning && (
          <div className="mb-4 bg-red-500/10 text-red-500 border border-red-500/20 text-xs px-3 py-2 rounded-lg font-medium">
            ⚠️ {result.warning}
          </div>
        )}

        <div className="space-y-4 mt-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Plan Tier</label>
            <div className="relative">
              <select
                value={config.plan}
                onChange={(e) => onUpdate(i, { plan: e.target.value })}
                className="w-full appearance-none bg-background border border-border text-foreground font-semibold rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors"
              >
                {validPlans.map((plan: string) => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Total Seats</label>
            <div className="flex items-center gap-2">
              <button onClick={() => onUpdate(i, { seats: Math.max(0, config.seats - 1) })} className="bg-background hover:bg-border border border-border w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-colors">−</button>
              
              <AnimatePresence mode="wait">
                <motion.div key={config.seats} className="flex-1 h-12 flex items-center justify-center bg-background border border-border rounded-xl" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={SPRING_SOFT}>
                  <span className="text-lg font-black">{config.seats}</span>
                </motion.div>
              </AnimatePresence>

              <button onClick={() => onUpdate(i, { seats: Math.min(500, config.seats + 1) })} className="bg-background hover:bg-border border border-border w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-colors">+</button>
            </div>
          </div>
        </div>
      </div>

      {(result.totalSavings > 0 || (result.breakdown && result.breakdown.length > 0)) && (
        <div className="mt-6 pt-6 border-t border-border">
          {result.totalSavings > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">Optimized</span>
              <span className="text-sm font-bold text-accent">Save {cur}{result.totalSavings}/mo</span>
            </div>
          )}
          {result.breakdown && result.breakdown.map((b: any, idx: number) => (
            <p key={idx} className={`text-xs font-medium mt-1 ${b.type === "ghost_seats" ? "text-foreground" : b.type === "incompatible_plan" ? "text-red-500 font-bold" : "text-secondary"}`}>
              {b.type === "ghost_seats" ? "⚠️ Ghost seats detected." : b.type === "incompatible_plan" ? "❌ Incompatible Plan." : "✓ Annual discount available."}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}
