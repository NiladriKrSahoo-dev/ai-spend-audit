"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "ai/react"; 
import {
  calculateSavings,
  PRICING_DB,
  getPlansForTool,
} from "../src/lib/audit/auditEngine"; // ✅ FIXED: Using relative path for Vercel stability

const SPRING = { type: "spring" as const, stiffness: 400, damping: 28 };
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

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("auditConfigs_v2");
    if (saved) {
      try { setConfigs(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // ── Calculation Engine ──────────────────────────────────────────
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

  // ── AI Integration ──────────────────────────────────────────────
  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
  });

  const handleGetAdvice = () => {
    // Detect which tool has the highest waste to provide specific AI context
    const sortedResults = [...results].sort((a, b) => b.totalSavings - a.totalSavings);
    const topWaste = sortedResults[0];

    append({
      role: "user",
      content: "Analyze my audit results and provide a strategic fiscal summary.",
    }, {
      body: {
        totalSavings: totals.savings,
        topWasteTool: topWaste.totalSavings > 0 ? topWaste.toolName : "General AI Overhead",
        currentSpend: totals.current
      }
    });
  };

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

  return (
    <div className="min-h-screen relative bg-background">
      <div className="hero-grid absolute inset-0 z-0 h-[80vh]" aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a 3.5 3.5 0 0 0 0 -7M7 12H4" /></svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Credex Audit</span>
        </div>
        <span className="text-xs font-semibold tracking-wider uppercase text-secondary">Est. 2026</span>
      </nav>

      <main className="relative z-10 max-w-6xl mx-
