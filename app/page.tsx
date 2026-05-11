// @ts-nocheck
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion"; 
import { useChat } from "@ai-sdk/react"; 
import { calculateSavings } from "../src/lib/audit/auditEngine"; 

const AVAILABLE_PLANS = ["Pro", "Team", "Business", "Enterprise", "Teams"];

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

// --- Custom Apple-style Animation Easings ---
const easeOutQuint = [0.22, 1, 0.36, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOutQuint } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [configs, setConfigs] = useState<ToolConfig[]>(
    TOOLS.map((t) => ({ plan: t.defaultPlan, seats: t.defaultSeats })),
  );

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
  });

  const results = useMemo(
    () => TOOLS.map((t, i) => calculateSavings(t.name, configs[i].seats, configs[i].plan, "monthly")),
    [configs],
  );

  const totals = useMemo(() => {
    let cur = 0, opt = 0;
    results.forEach((r) => {
      if (r.currency === "$") { cur += r.currentSpend; opt += r.suggestedSpend; }
    });
    return { current: cur, optimised: opt, savings: cur - opt };
  }, [results]);

  const handleGetAdvice = () => {
    const sortedResults = [...results].sort((a, b) => b.totalSavings - a.totalSavings);
    const topWaste = sortedResults[0];
    const biggestWasteName = topWaste.totalSavings > 0 ? topWaste.toolName : "General Overhead";

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
    // Apple's signature light gray background (#F5F5F7) and off-black text (#1D1D1F)
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-200">
      <main className="max-w-5xl mx-auto px-6 py-24">
        
        {/* HERO SECTION */}
        <motion.header 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          variants={fadeInUp}
          className="text-center mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-4">
            Credex Auditor.
            <br />
            <span className="text-gray-400">Optimize brilliantly.</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium mb-16 max-w-2xl mx-auto">
            A seamless fiscal analysis of your enterprise AI stack.
          </p>

          {/* MAIN SAVINGS DISPLAY */}
          <motion.div 
            variants={fadeInUp}
            className="bg-white p-12 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-3xl mx-auto border border-gray-100"
          >
             <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-6">Monthly Potential Savings</p>
             <p className="text-7xl md:text-9xl font-bold tracking-tighter text-[#1D1D1F] mb-10">
               ${totals.savings.toLocaleString()}
             </p>
             
             <button 
                onClick={handleGetAdvice}
                disabled={isLoading || totals.savings === 0}
                className="bg-[#1D1D1F] text-white px-10 py-4 rounded-full font-medium text-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-30 disabled:hover:scale-100 shadow-xl"
             >
               {isLoading ? "Consulting AI Engine..." : "Get Strategic Summary"}
             </button>
          </motion.div>
          
          {/* AI CHAT RESPONSE */}
          {messages.filter(m => m.role === 'assistant').length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: easeOutQuint }}
              className="mt-8 p-8 bg-blue-50 border border-blue-100 rounded-[2rem] text-left max-w-3xl mx-auto shadow-sm"
            >
              <p className="text-blue-900 font-medium text-lg leading-relaxed">
                {messages.filter(m => m.role === 'assistant').map(m => m.content).join('')}
              </p>
            </motion.div>
          )}
        </motion.header>

        {/* STAGGERED TOOL CARDS */}
        <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Your Stack.</h2>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }} // Triggers when scrolling near them
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {TOOLS.map((t, i) => (
            <motion.div 
              variants={fadeInUp} 
              key={t.name} 
              className="bg-white p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500"
            >
              <div className="mb-8">
                <h3 className="font-semibold text-2xl tracking-tight mb-4">{t.name}</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-[#F5F5F7] px-4 py-2 rounded-xl">
                      <p className="text-sm font-medium text-gray-500">Plan</p>
                      <select 
                        value={configs[i].plan}
                        onChange={(e) => update(i, { plan: e.target.value })}
                        className="bg-transparent text-sm font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                      >
                        {AVAILABLE_PLANS.map(plan => (
                          <option key={plan} value={plan}>{plan}</option>
                        ))}
                      </select>
                  </div>
                  <div className="flex justify-between items-center bg-[#F5F5F7] px-4 py-2 rounded-xl">
                      <p className="text-sm font-medium text-gray-500">Seats</p>
                      <p className="text-sm font-semibold text-[#1D1D1F]">{configs[i].seats}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={() => update(i, { seats: Math.max(0, configs[i].seats - 1) })} className="bg-[#F5F5F7] hover:bg-gray-200 text-[#1D1D1F] w-12 h-12 rounded-full font-medium text-xl transition-colors">-</button>
                <button onClick={() => update(i, { seats: configs[i].seats + 1 })} className="bg-[#F5F5F7] hover:bg-gray-200 text-[#1D1D1F] w-12 h-12 rounded-full font-medium text-xl transition-colors">+</button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
