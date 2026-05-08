"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateSavings,
  PRICING_DB,
  getPlansForTool,
} from "@/src/lib/audit/auditEngine";

const SPRING = { type: "spring" as const, stiffness: 400, damping: 28 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 300, damping: 24 };

interface ToolMeta { name: string; accent: string; defaultPlan: string; defaultSeats: number; }
interface ToolConfig { plan: string; seats: number; }
interface CompRow { tool: string; plan: string; monthly: number | null; annual: number | null; currency: string; savings: number; minSeats: number; perUser: boolean; }

const TOOLS: ToolMeta[] = [
  { name: "Cursor",         accent: "#007AFF", defaultPlan: "Teams",    defaultSeats: 10 },
  { name: "ChatGPT",        accent: "#34C759", defaultPlan: "Business", defaultSeats: 10 },
  { name: "Claude",         accent: "#FF9500", defaultPlan: "Team",     defaultSeats: 8  },
  { name: "GitHub Copilot", accent: "#AF52DE", defaultPlan: "Business", defaultSeats: 10 },
  { name: "Gemini",         accent: "#5AC8FA", defaultPlan: "Pro",      defaultSeats: 5  },
  { name: "V0.dev",         accent: "#5856D6", defaultPlan: "Team",     defaultSeats: 5  },
];

function buildComparison(): CompRow[] {
  const rows: CompRow[] = [];
  for (const [toolName, td] of Object.entries(PRICING_DB)) {
    for (const [planName, p] of Object.entries(td.plans)) {
      if (p.monthly === null && p.annual === null) continue;
      const sav = p.monthly !== null && p.annual !== null ? (p.monthly - p.annual) * 12 : 0;
      rows.push({ tool: toolName, plan: planName, monthly: p.monthly, annual: p.annual, currency: p.currency, savings: sav, minSeats: p.minSeats, perUser: p.perUser });
    }
  }
  return rows;
}

export default function Home() {
  const [configs, setConfigs] = useState<ToolConfig[]>(
    TOOLS.map((t) => ({ plan: t.defaultPlan, seats: t.defaultSeats })),
  );

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
    setConfigs((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));
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
    <div className="min-h-screen relative">
      {/* ── Liquid color blobs ──────────────────────────────────────── */}
      <div className="ambient-layer" aria-hidden="true">
        <div className="blob blob-animate w-[500px] h-[500px] bg-blue/30 top-[-10%] left-[5%]" />
        <div className="blob blob-animate w-[400px] h-[400px] bg-purple/20 top-[15%] right-[0%]" style={{ animationDelay: "4s" }} />
        <div className="blob blob-animate w-[450px] h-[450px] bg-teal/20 top-[40%] left-[50%]" style={{ animationDelay: "8s" }} />
        <div className="blob blob-animate w-[350px] h-[350px] bg-orange/15 bottom-[10%] left-[10%]" style={{ animationDelay: "12s" }} />
        <div className="blob blob-animate w-[500px] h-[500px] bg-green/15 bottom-[-5%] right-[15%]" style={{ animationDelay: "6s" }} />
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="liquid-glass-nav sticky top-0 z-50 flex items-center justify-between px-6 lg:px-10 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-indigo flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">AI Spend Audit</span>
        </div>
        <span className="text-[11px] text-secondary font-mono tracking-wide">Verified May 2026</span>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8 py-10 lg:py-14">

        {/* ━━ Hero ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div className="liquid-glass p-8 sm:p-10 lg:p-12" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_SOFT, delay: 0.1 }}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">Total Projected Savings</p>
              <AnimatePresence mode="wait">
                <motion.h1 key={totals.savings} className={`text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] tabular-nums ${totals.savings > 0 ? "text-green" : "text-tertiary"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={SPRING}>
                  ${totals.savings.toLocaleString()}<span className="text-2xl text-secondary font-normal">/mo</span>
                </motion.h1>
              </AnimatePresence>
              {totals.savings > 0 ? (
                <p className="text-sm text-secondary">That&apos;s <span className="text-green font-semibold">${totals.annual.toLocaleString()}/yr</span> back in your budget</p>
              ) : (
                <p className="text-sm text-tertiary">Adjust tools below to find savings</p>
              )}
            </div>
            <div className="flex gap-10">
              <StatBox label="Current" value={`$${totals.current.toLocaleString()}`} sub="/month" />
              <StatBox label="Optimised" value={`$${totals.optimised.toLocaleString()}`} sub="/month" highlight={totals.savings > 0} />
            </div>
          </div>
        </motion.div>

        {/* ━━ Quick Stats ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            { l: "Tools Tracked", v: String(TOOLS.length) },
            { l: "Total Seats", v: String(totals.totalSeats) },
            { l: "Optimisable", v: `${totals.withSavings} tool${totals.withSavings !== 1 ? "s" : ""}` },
            { l: "Avg Cost/Seat", v: totals.totalSeats > 0 ? `$${Math.round(totals.current / totals.totalSeats)}` : "—" },
          ].map((s) => (
            <div key={s.l} className="liquid-glass-sm px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">{s.l}</p>
              <p className="text-xl font-semibold tabular-nums mt-1 text-foreground">{s.v}</p>
            </div>
          ))}
        </div>

        {/* ━━ Configure Your Stack ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Configure Your Stack" sub="Set each tool's plan and seat count to see real-time savings" className="mt-14" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {TOOLS.slice(0, 3).map((t, i) => (
            <ToolCard key={t.name} meta={t} config={configs[i]} result={results[i]} i={i} onUpdate={update} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {TOOLS.slice(3).map((t, i) => (
            <ToolCard key={t.name} meta={t} config={configs[i + 3]} result={results[i + 3]} i={i + 3} onUpdate={update} />
          ))}
        </div>

        {/* ━━ Key Insights ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {insights.length > 0 && (
          <>
            <Section title="Key Insights" sub={`${insights.length} optimisation${insights.length > 1 ? "s" : ""} found`} className="mt-14" />
            <div className="space-y-3 mt-6">
              {insights.map((ins, i) => (
                <motion.div key={i} className="liquid-glass-sm px-6 py-5 flex items-start gap-4" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SPRING_SOFT, delay: 0.1 + i * 0.05 }}>
                  <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${ins.type === "ghost" ? "bg-orange/10" : "bg-blue/10"}`}>
                    {ins.type === "ghost" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange"><path d="M12 2a7 7 0 0 0-7 7v4l-2 4h18l-2-4V9a7 7 0 0 0-7-7z" /><circle cx="9" cy="11" r="1" /><circle cx="15" cy="11" r="1" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary font-mono mb-1">{ins.tool}</p>
                    <p className={`text-[13px] leading-relaxed font-medium tracking-[-0.01em] ${ins.type === "ghost" ? "text-orange" : "text-blue"}`}>{ins.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ━━ Pricing Reference (grouped) ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Monthly vs. Annual Pricing" sub="Complete per-seat reference across all tools" className="mt-14" />

        <div className="space-y-5 mt-6">
          {Array.from(grouped.entries()).map(([toolName, rows]) => (
            <motion.div key={toolName} className="liquid-glass p-6 sm:p-7" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_SOFT}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TOOLS.find((t) => t.name === toolName)?.accent ?? "#888" }} />
                <h3 className="text-[15px] font-semibold text-foreground">{toolName}</h3>
                <span className="text-[10px] text-tertiary ml-auto font-mono">{PRICING_DB[toolName]?.source.replace("https://", "")}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-strong">
                      {["Plan", "Type", "Monthly", "Annual", "Save/Yr", "Min Seats"].map((h) => (
                        <th key={h} className={`text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary pb-3 ${h === "Plan" || h === "Type" ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.plan} className="comparison-row border-b border-border">
                        <td className="py-3 font-medium text-foreground">{r.plan}</td>
                        <td className="py-3 text-secondary text-xs">{r.perUser ? "per user" : "flat"}</td>
                        <td className="py-3 text-right tabular-nums text-foreground">{r.monthly !== null ? `${r.currency}${r.monthly.toLocaleString()}` : "—"}</td>
                        <td className="py-3 text-right tabular-nums text-foreground">{r.annual !== null ? `${r.currency}${r.annual}` : <span className="text-tertiary">—</span>}</td>
                        <td className="py-3 text-right tabular-nums">{r.savings > 0 ? <span className="text-green font-semibold">{r.currency}{r.savings}</span> : <span className="text-tertiary">—</span>}</td>
                        <td className="py-3 text-right tabular-nums">{r.minSeats > 1 ? <span className="text-orange font-medium">{r.minSeats} min</span> : <span className="text-tertiary">1</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ━━ Data Sources ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Data Sources" sub="All pricing verified from official vendor pages, May 7 2026" className="mt-14" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Object.entries(PRICING_DB).map(([name, data]) => (
            <div key={name} className="liquid-glass-sm px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{name}</span>
              <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-xs text-blue hover:underline truncate max-w-[180px]">{data.source.replace("https://", "").split("/").slice(0, 2).join("/")}</a>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border py-8 px-6 text-center">
        <p className="text-xs text-tertiary">AI Spend Audit · Data sourced from official pricing pages · Not financial advice</p>
      </footer>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function Section({ title, sub, className = "" }: { title: string; sub: string; className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
      <p className="text-sm text-secondary mt-1">{sub}</p>
    </div>
  );
}

function StatBox({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[11px] uppercase tracking-[0.12em] text-secondary mb-1">{label}</p>
      <p className={`text-2xl lg:text-3xl font-semibold tabular-nums tracking-[-0.02em] ${highlight ? "text-green" : "text-foreground"}`}>{value}</p>
      <p className="text-[11px] text-tertiary">{sub}</p>
    </div>
  );
}

function ToolCard({ meta, config, result, i, onUpdate }: { meta: ToolMeta; config: ToolConfig; result: ReturnType<typeof calculateSavings>; i: number; onUpdate: (i: number, p: Partial<ToolConfig>) => void }) {
  const plans = getPlansForTool(meta.name);
  const savings = result.totalSavings;
  const cur = result.currency;

  return (
    <motion.div className="liquid-glass card-glow p-6 flex flex-col" whileHover={{ scale: 1.012, transition: SPRING }} whileTap={{ scale: 0.988, transition: SPRING }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_SOFT, delay: 0.12 + i * 0.05 }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: meta.accent }} />
          <span className="text-[15px] font-semibold text-foreground">{meta.name}</span>
        </div>
        {savings > 0 && (
          <motion.span className="text-[11px] font-semibold text-green bg-green/10 px-2.5 py-1 rounded-full" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING}>
            Save {cur}{savings}/mo
          </motion.span>
        )}
      </div>

      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary mb-1.5">Plan</label>
      <select value={config.plan} onChange={(e) => onUpdate(i, { plan: e.target.value })} className="liquid-glass-input w-full h-11 px-4 pr-10 text-sm text-foreground cursor-pointer mb-4">
        {plans.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary mb-1.5">Seats</label>
      <div className="flex items-center gap-3 mb-5">
        <motion.button whileTap={{ scale: 0.82 }} transition={SPRING} onClick={() => onUpdate(i, { seats: Math.max(1, config.seats - 1) })} className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-secondary text-lg transition-colors" aria-label="Decrease">−</motion.button>
        <AnimatePresence mode="wait">
          <motion.span key={config.seats} className="flex-1 text-center text-xl font-semibold tabular-nums text-foreground" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>{config.seats}</motion.span>
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.82 }} transition={SPRING} onClick={() => onUpdate(i, { seats: Math.min(500, config.seats + 1) })} className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-secondary text-lg transition-colors" aria-label="Increase">+</motion.button>
      </div>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-foreground">{cur}{result.currentSpend.toLocaleString()}</span>
          <span className="text-xs text-tertiary">/month</span>
        </div>
        {result.breakdown.some((b) => b.type === "ghost_seats") && <p className="mt-2 text-[11px] text-orange leading-relaxed">⚠ Paying for unused ghost seats</p>}
        {result.breakdown.some((b) => b.type === "annual_switch") && <p className="mt-2 text-[11px] text-blue leading-relaxed">💡 Annual billing saves {cur}{result.breakdown.find((b) => b.type === "annual_switch")!.monthlySavings}/mo</p>}
      </div>
    </motion.div>
  );
}
