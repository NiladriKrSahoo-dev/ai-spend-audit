// ---------------------------------------------------------------------------
// AI Spend Audit Engine
// Calculates savings opportunities based on verified pricing data (2026-05-07)
// ---------------------------------------------------------------------------

/** Every plan we track, keyed by tool then plan name. */
export interface PlanPricing {
  /** Monthly price per seat (in the plan's native currency) */
  monthly: number | null;
  /** Effective monthly price per seat when billed annually */
  annual: number | null;
  /** Total billed up-front when paying annually */
  annualTotal: number | null;
  /** Minimum seats required to purchase this plan */
  minSeats: number;
  /** Whether the price is per-user (team plans) vs flat (individual) */
  perUser: boolean;
  /** Currency symbol */
  currency: string;
}

export interface ToolPricing {
  plans: Record<string, PlanPricing>;
  source: string;
  /** The plan name to fall back to when checking ghost-seat downgrades */
  individualFallback: string | null;
}

// ---------------------------------------------------------------------------
// Pricing database – sourced from PRICING_DATA.md (verified 2026-05-07)
// ---------------------------------------------------------------------------

export const PRICING_DB: Record<string, ToolPricing> = {
  Cursor: {
    source: "https://cursor.com/pricing",
    individualFallback: "Pro",
    plans: {
      Hobby:      { monthly: 0,    annual: null, annualTotal: null,  minSeats: 1, perUser: false, currency: "$" },
      Pro:        { monthly: 20,   annual: 16,   annualTotal: 192,   minSeats: 1, perUser: false, currency: "$" },
      Teams:      { monthly: 40,   annual: null, annualTotal: null,  minSeats: 1, perUser: true,  currency: "$" },
      Enterprise: { monthly: null, annual: null, annualTotal: null,  minSeats: 1, perUser: true,  currency: "$" },
    },
  },

  "GitHub Copilot": {
    source: "https://github.com/features/copilot/plans",
    individualFallback: "Individual",
    plans: {
      Individual: { monthly: 10,   annual: 8.33, annualTotal: 100,   minSeats: 1, perUser: false, currency: "$" },
      Business:   { monthly: 19,   annual: null, annualTotal: null,  minSeats: 1, perUser: true,  currency: "$" },
      Enterprise: { monthly: 39,   annual: null, annualTotal: null,  minSeats: 1, perUser: true,  currency: "$" },
    },
  },

  Claude: {
    source: "https://www.anthropic.com/pricing",
    individualFallback: "Pro",
    plans: {
      Free:       { monthly: 0,    annual: null, annualTotal: null,  minSeats: 1, perUser: false, currency: "$" },
      Pro:        { monthly: 20,   annual: 17,   annualTotal: 204,   minSeats: 1, perUser: false, currency: "$" },
      Team:       { monthly: 30,   annual: 25,   annualTotal: 300,   minSeats: 5, perUser: true,  currency: "$" },
      Max: { monthly: 100, annual: null, annualTotal: null, minSeats: 1, perUser: true, currency: "$" },
      Enterprise: { monthly: null, annual: null, annualTotal: null,  minSeats: 1, perUser: true,  currency: "$" },
    },
  },

  ChatGPT: {
    source: "https://chatgpt.com/pricing/",
    individualFallback: "Plus",
    plans: {
      Go:         { monthly: 8,    annual: null, annualTotal: null,  minSeats: 1, perUser: false, currency: "$" },
      Plus:       { monthly: 20,   annual: null, annualTotal: null,  minSeats: 1, perUser: false, currency: "$" },
      Business:   { monthly: 30,   annual: 25,   annualTotal: 300,   minSeats: 2, perUser: true,  currency: "$" },
      Pro:        { monthly: 200,  annual: null, annualTotal: null,  minSeats: 1, perUser: false, currency: "$" },
      Enterprise: { monthly: null, annual: null, annualTotal: null,  minSeats: 1, perUser: true,  currency: "$" },
    },
  },

  Gemini: {
    source: "https://one.google.com/about/google-ai-plans/",
    individualFallback: "Pro",
    plans: {
      Pro:   { monthly: 1950,  annual: null, annualTotal: null, minSeats: 1, perUser: false, currency: "₹" },
      Ultra: { monthly: 24500, annual: null, annualTotal: null, minSeats: 1, perUser: false, currency: "₹" },
    },
  },

  "V0.dev": {
    source: "https://v0.dev/pricing",
    individualFallback: "Premium",
    plans: {
      Free:     { monthly: 0,    annual: null, annualTotal: null, minSeats: 1, perUser: false, currency: "$" },
      Premium:  { monthly: 20,   annual: null, annualTotal: null, minSeats: 1, perUser: false, currency: "$" },
      Team:     { monthly: 30,   annual: null, annualTotal: null, minSeats: 1, perUser: true,  currency: "$" },
      Business: { monthly: null, annual: null, annualTotal: null, minSeats: 1, perUser: true,  currency: "$" },
    },
  },
};

// ---------------------------------------------------------------------------
// Audit result types
// ---------------------------------------------------------------------------

export interface AuditResult {
  /** Current monthly spend */
  currentSpend: number;
  /** Suggested optimised monthly spend */
  suggestedSpend: number;
  /** Total monthly savings */
  totalSavings: number;
  /** Human-readable recommendation */
  recommendation: string;
  /** Currency symbol for display */
  currency: string;
  /** Breakdown of individual saving opportunities */
  breakdown: SavingOpportunity[];
}

export interface SavingOpportunity {
  type: "annual_switch" | "ghost_seats" | "plan_downgrade" | "incompatible_plan";
  description: string;
  monthlySavings: number;
}

// ---------------------------------------------------------------------------
// Core audit function
// ---------------------------------------------------------------------------

/**
 * Calculate AI spend savings for a given tool, user count, and current plan.
 *
 * @param toolName   - Name of the tool (e.g. "Cursor", "Claude")
 * @param users      - Number of active users / seats
 * @param currentPlan - The plan name the org is currently on (e.g. "Teams", "Pro")
 * @param billingCycle - Whether the org currently pays "monthly" or "annual"
 * @returns An AuditResult with currentSpend, suggestedSpend, totalSavings,
 *          a recommendation string, and a detailed breakdown.
 */
export function calculateSavings(
  toolName: string,
  users: number,
  currentPlan: string,
  billingCycle: "monthly" | "annual" = "monthly",
): AuditResult {
  const tool = PRICING_DB[toolName];
  if (!tool) {
    return {
      currentSpend: 0,
      suggestedSpend: 0,
      totalSavings: 0,
      recommendation: `Unknown tool "${toolName}". Supported tools: ${Object.keys(PRICING_DB).join(", ")}.`,
      currency: "$",
      breakdown: [],
    };
  }

  const plan = tool.plans[currentPlan];
  if (!plan) {
    return {
      currentSpend: 0,
      suggestedSpend: 0,
      totalSavings: 0,
      recommendation: `Unknown plan "${currentPlan}" for ${toolName}. Available plans: ${Object.keys(tool.plans).join(", ")}.`,
      currency: "$",
      breakdown: [],
    };
  }

  // Contact-sales plans can't be audited
  if (plan.monthly === null) {
    return {
      currentSpend: 0,
      suggestedSpend: 0,
      totalSavings: 0,
      recommendation: `${toolName} ${currentPlan} uses custom/contact-sales pricing — unable to calculate savings automatically.`,
      currency: plan.currency,
      breakdown: [],
    };
  }

  const breakdown: SavingOpportunity[] = [];

  // -----------------------------------------------------------------------
  // Check for Incompatible Plan (Individual plan with >1 seats)
  // -----------------------------------------------------------------------
  if (!plan.perUser && users > 1) {
    const planNames = Object.keys(tool.plans);
    const currentIdx = planNames.indexOf(currentPlan);
    const nextPlan = currentIdx !== -1 && currentIdx < planNames.length - 1 ? planNames[currentIdx + 1] : "a Team plan";

    return {
      currentSpend: 0,
      suggestedSpend: 0,
      totalSavings: 0,
      recommendation: `⚠️ Incompatible Plan: ${currentPlan} is for individuals. For ${users} users, please upgrade to ${nextPlan}.`,
      currency: plan.currency,
      breakdown: [{
        type: "incompatible_plan",
        description: `Seat count exceeds ${currentPlan} plan limit. Suggesting next tier up: ${nextPlan}.`,
        monthlySavings: 0,
      }],
    };
  }

  // -----------------------------------------------------------------------
  // 1. Calculate current monthly spend
  // -----------------------------------------------------------------------
  const effectiveSeats = plan.perUser ? Math.max(users, plan.minSeats) : users;
  const currentMonthlyRate =
    billingCycle === "annual" && plan.annual !== null ? plan.annual : plan.monthly;
  const currentSpend = plan.perUser
    ? currentMonthlyRate * effectiveSeats
    : currentMonthlyRate * users;

  let suggestedSpend = currentSpend;

  // -----------------------------------------------------------------------
  // 2. Check for Annual Savings
  // -----------------------------------------------------------------------
  if (billingCycle === "monthly" && plan.annual !== null) {
    const annualSpend = plan.perUser
      ? plan.annual * effectiveSeats
      : plan.annual * users;
    const annualSavings = currentSpend - annualSpend;

    if (annualSavings > 0) {
      breakdown.push({
        type: "annual_switch",
        description:
          `Switch to annual billing: ${plan.currency}${plan.monthly}/mo → ${plan.currency}${plan.annual}/mo per seat ` +
          `(billed as ${plan.currency}${plan.annualTotal}/yr). ` +
          `Saves ${plan.currency}${annualSavings.toFixed(2)}/mo.`,
        monthlySavings: annualSavings,
      });
      suggestedSpend = annualSpend;
    }
  }

  // -----------------------------------------------------------------------
  // 3. Check for Ghost Seats
  //    If users < minSeats on a team plan, they're paying for empty chairs.
  //    Compare cost of team plan (at minSeats) vs individual plans for each user.
  // -----------------------------------------------------------------------
  if (plan.perUser && plan.minSeats > 1 && users < plan.minSeats) {
    const fallbackPlanName = tool.individualFallback;
    const fallbackPlan = fallbackPlanName ? tool.plans[fallbackPlanName] : null;

    if (fallbackPlan && fallbackPlan.monthly !== null) {
      const ghostSeats = plan.minSeats - users;
      const teamCost = plan.monthly * plan.minSeats; // paying for min seats
      const individualCost = fallbackPlan.monthly * users;

      if (individualCost < teamCost) {
        const ghostSavings = teamCost - individualCost;
        breakdown.push({
          type: "ghost_seats",
          description:
            `You have ${users} user(s) but the ${currentPlan} plan requires a minimum of ${plan.minSeats} seats — ` +
            `you're paying for ${ghostSeats} unused "ghost" seat(s). ` +
            `Switching ${users} user(s) to individual ${fallbackPlanName} plans ` +
            `(${plan.currency}${fallbackPlan.monthly}/mo each) would save ${plan.currency}${ghostSavings.toFixed(2)}/mo.`,
          monthlySavings: ghostSavings,
        });

        // Update suggested spend to the cheaper individual option
        suggestedSpend = Math.min(suggestedSpend, individualCost);
      }
    }
  }

  // -----------------------------------------------------------------------
  // 4. Build final result
  // -----------------------------------------------------------------------
  const totalSavings = currentSpend - suggestedSpend;

  let recommendation: string;
  if (totalSavings <= 0) {
    recommendation = `✅ Your ${toolName} ${currentPlan} plan is already optimised for ${users} user(s). No savings found.`;
  } else {
    const tips = breakdown.map((b) => `• ${b.description}`).join("\n");
    recommendation =
      `💰 You can save ${plan.currency}${totalSavings.toFixed(2)}/mo (${plan.currency}${(totalSavings * 12).toFixed(2)}/yr) on ${toolName}:\n` +
      tips;
  }

  return {
    currentSpend: Math.round(currentSpend * 100) / 100,
    suggestedSpend: Math.round(suggestedSpend * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    recommendation,
    currency: plan.currency,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// Convenience: list available tools & plans for UI dropdowns
// ---------------------------------------------------------------------------

export function getAvailableTools(): string[] {
  return Object.keys(PRICING_DB);
}

export function getPlansForTool(toolName: string): string[] {
  const tool = PRICING_DB[toolName];
  return tool ? Object.keys(tool.plans) : [];
}
