"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateSavings,
  PRICING_DB,
  getPlansForTool,
} from "@/src/lib/audit/auditEngine";

const SPRING = { type: "spring" as const, stiffness: 400, damping: 28 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 300, damping: 24 };

interface ToolMeta { name: string; defaultPlan: string; defaultSeats: number; }
interface ToolConfig { plan: string; seats: number; }
interface CompRow { tool: string; plan: string; monthly: number | null; annual: number | null; currency: string; savings: number; minSeats: number; perUser: boolean; }

const TOOLS: ToolMeta[] = [
  { name: "Cursor",         defaultPlan: "Teams",    defaultSeats: 10 },
  { name: "ChatGPT",        defaultPlan: "Business", defaultSeats: 10 },
  { name: "Claude",         defaultPlan: "Team",     defaultSeats: 8  },
  { name: "GitHub Copilot", defaultPlan: "Business", defaultSeats: 10 },
  { name: "Gemini",         defaultPlan: "Pro",      defaultSeats: 5  },
  { name: "V0.dev",         defaultPlan: "Team",     defaultSeats: 5  },
];

function buildComparison(): CompRow[] {
  const rows: CompRow[] = [];
  for (const [toolName, td] of Object.entries(PRICING_DB)) {
    for (const [planName, p] of Object.entries(td.plans)) {
      const sav = p.monthly !== null && p.annual !== null ? (p.monthly - p.annual) * 12 : 0;
      rows.push({ tool: toolName, plan: planName, monthly: p.monthly, annual: p.annual, currency: p.currency, savings: sav, minSeats: p.minSeats, perUser: p.perUser });
    }
  }
  return rows;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [configs, setConfigs] = useState<ToolConfig[]>(
    TOOLS.map((t) => ({ plan: t.defaultPlan, seats: t.defaultSeats })),
  );

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("auditConfigs");
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
  }, [results, configs]);

  const update = useCallback((i: number, patch: Partial<ToolConfig>) => {
    setConfigs((prev) => {
      const next = prev.map((c, j) => (j === i ? { ...c, ...patch } : c));
      localStorage.setItem("auditConfigs", JSON.stringify(next));
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

  const comparison = useMemo(() => buildComparison(), []);
  const grouped = useMemo(() => {
    const map = new Map<string, CompRow[]>();
    comparison.forEach((r) => { const arr = map.get(r.tool) || []; arr.push(r); map.set(r.tool, arr); });
    return map;
  }, [comparison]);

  return (
    <div className="min-h-screen relative bg-background">
      {/* ── Background Elements ─────────────────────────────────────── */}
      <div className="hero-grid absolute inset-0 z-0 h-[80vh]" aria-hidden="true" />

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Credex Audit</span>
        </div>
        <span className="text-xs font-semibold tracking-wider uppercase text-secondary">Est. 2026</span>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
        
        {/* ━━ Hero ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_SOFT}>
            {totals.savings > 0 && (
              <span className="pill-badge mb-6">
                <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Save up to ${totals.annual.toLocaleString()}/yr
              </span>
            )}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[1.05] text-foreground mb-6">
              POTENTIAL MONTHLY SAVINGS
            </h1>
            <p className="text-lg text-secondary font-medium tracking-tight">
              We found opportunities to reduce your AI spend based on your current setup.
            </p>
          </motion.div>

          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex-1 w-full text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Current Spend</p>
              <p className="text-3xl md:text-4xl font-bold tracking-tight">${totals.current.toLocaleString()}<span className="text-base text-tertiary font-medium">/mo</span></p>
            </div>
            
            <div className="hidden sm:block w-px h-16 bg-border mx-2"></div>
            <div className="sm:hidden w-full h-px bg-border my-2"></div>
            
            <div className="flex-1 w-full text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Optimized</p>
              <p className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">${totals.optimised.toLocaleString()}<span className="text-base text-tertiary font-medium">/mo</span></p>
            </div>

            <div className="hidden sm:block w-px h-16 bg-border mx-2"></div>
            <div className="sm:hidden w-full h-px bg-border my-2"></div>

            <div className="flex-1 w-full text-center sm:text-right bg-accent/10 p-4 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Savings</p>
              <p className="text-3xl md:text-4xl font-bold tracking-tight text-accent">${totals.savings.toLocaleString()}<span className="text-base text-accent/70 font-medium">/mo</span></p>
            </div>
          </motion.div>
        </div>

        {/* ━━ Configure Your Stack ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight uppercase">Audit Marketplace</h2>
          <p className="text-sm font-medium text-secondary mt-1">Adjust your seat counts and plans below.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mounted && TOOLS.map((t, i) => (
            <ToolCard key={t.name} meta={t} config={configs[i]} result={results[i]} i={i} onUpdate={update} />
          ))}
          {!mounted && TOOLS.map((t, i) => (
            <ToolCard key={t.name} meta={t} config={{ plan: t.defaultPlan, seats: t.defaultSeats }} result={calculateSavings(t.name, t.defaultSeats, t.defaultPlan, "monthly")} i={i} onUpdate={update} />
          ))}
        </div>

        {/* ━━ Key Insights ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {insights.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold tracking-tight mb-6">How to claim your savings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((ins, i) => (
                <motion.div key={i} className="flat-card p-5 flex items-start gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_SOFT, delay: i * 0.05 }}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${ins.type === "ghost" ? "bg-black text-white" : "bg-accent text-white"}`}>
                    {ins.type === "ghost" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">{ins.tool}</p>
                    <p className="text-sm font-medium text-secondary">{ins.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ━━ Pricing Reference ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold tracking-tight uppercase mb-8">Pricing Directory</h2>
          
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([toolName, rows]) => (
              <div key={toolName} className="flat-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">{toolName}</h3>
                  <a href={PRICING_DB[toolName]?.source} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-wider text-blue hover:underline">
                    View Source
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-foreground">
                        {["Plan", "Type", "Monthly", "Annual", "Save/Yr", "Min Seats"].map((h) => (
                          <th key={h} className={`py-3 text-xs font-bold uppercase tracking-widest text-foreground ${h === "Plan" || h === "Type" ? "text-left" : "text-right"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.plan} className="comparison-row border-b border-border">
                          <td className="py-4 font-bold text-foreground">{r.plan}</td>
                          <td className="py-4 font-medium text-secondary text-xs uppercase tracking-wider">{r.perUser ? "Per User" : "Flat Fee"}</td>
                          <td className="py-4 text-right font-medium text-foreground">{r.monthly !== null ? `${r.currency}${r.monthly.toLocaleString()}` : "Custom Pricing"}</td>
                          <td className="py-4 text-right font-medium text-foreground">{r.annual !== null ? `${r.currency}${r.annual}` : <span className="text-tertiary">{r.monthly === null ? "Custom Pricing" : "—"}</span>}</td>
                          <td className="py-4 text-right font-bold">{r.savings > 0 ? <span className="text-accent">{r.currency}{r.savings}</span> : <span className="text-tertiary">—</span>}</td>
                          <td className="py-4 text-right font-bold">{r.minSeats > 1 ? <span className="text-foreground">{r.minSeats} min</span> : <span className="text-tertiary">1</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-12 px-6 text-center bg-card">
        <p className="text-sm font-bold uppercase tracking-widest text-foreground mb-2">Credex Rocks Implementation</p>
        <p className="text-xs font-medium text-secondary">Built with Next.js & Tailwind CSS. Verified Pricing Engine.</p>
      </footer>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function ToolCard({ meta, config, result, i, onUpdate }: { meta: ToolMeta; config: ToolConfig; result: ReturnType<typeof calculateSavings>; i: number; onUpdate: (i: number, p: Partial<ToolConfig>) => void }) {
  const plans = getPlansForTool(meta.name);
  const cur = result.currency;
  const isCustom = PRICING_DB[meta.name]?.plans[config.plan]?.monthly === null;

  return (
    <motion.div className="flat-card p-6 flex flex-col" whileHover={{ y: -4 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_SOFT, delay: 0.1 + i * 0.05 }}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">{meta.name}</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-1">SaaS License</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight">{isCustom ? "Custom Pricing" : `${cur}${result.currentSpend.toLocaleString()}`}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-tertiary mt-0.5">/month</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-foreground mb-2">Plan Tier</label>
          <select value={config.plan} onChange={(e) => onUpdate(i, { plan: e.target.value })} className="select-input w-full h-12 text-sm font-medium">
            {plans.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-foreground mb-2">Total Seats</label>
          <div className="flex items-center gap-2">
            <button onClick={() => onUpdate(i, { seats: Math.max(1, config.seats - 1) })} className="control-btn w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg">−</button>
            <AnimatePresence mode="wait">
              <motion.div key={config.seats} className="flex-1 h-12 flex items-center justify-center bg-white border border-border rounded-xl" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.1 }}>
                <span className="text-lg font-black">{config.seats}</span>
              </motion.div>
            </AnimatePresence>
            <button onClick={() => onUpdate(i, { seats: Math.min(500, config.seats + 1) })} className="control-btn w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg">+</button>
          </div>
        </div>
      </div>

      {(result.totalSavings > 0 || result.breakdown.length > 0) && (
        <div className="mt-6 pt-6 border-t border-border">
          {result.totalSavings > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">Optimized</span>
              <span className="text-sm font-bold text-accent">Save {cur}{result.totalSavings}/mo</span>
            </div>
          )}
          {result.breakdown.map((b, idx) => (
            <p key={idx} className={`text-xs font-medium mt-1 ${b.type === "ghost_seats" ? "text-foreground" : b.type === "incompatible_plan" ? "text-red-500 font-bold" : "text-secondary"}`}>
              {b.type === "ghost_seats" ? "⚠️ Ghost seats detected." : b.type === "incompatible_plan" ? "❌ Incompatible Plan." : "✓ Annual discount available."}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}