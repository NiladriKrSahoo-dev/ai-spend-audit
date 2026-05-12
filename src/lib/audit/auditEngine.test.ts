import { calculateSavings } from "./auditEngine";

describe("auditEngine calculateSavings", () => {
  it("1. calculates monthly math correctly", () => {
    const result = calculateSavings("Claude", 1, "Pro", "monthly");
    expect(result.currentSpend).toBe(20);
    expect(result.suggestedSpend).toBe(17);
    expect(result.totalSavings).toBe(3);
    expect(result.breakdown[0].type).toBe("annual_switch");
  });

  it("2. applies annual math when billing cycle is annual", () => {
    const result = calculateSavings("GitHub Copilot", 1, "Individual", "annual");
    expect(result.currentSpend).toBe(8.33);
    expect(result.suggestedSpend).toBe(8.33);
    expect(result.totalSavings).toBe(0);
    expect(result.breakdown.length).toBe(0);
  });

  it("3. detects ghost seats (seat minimums)", () => {
    const result = calculateSavings("Claude", 3, "Team", "monthly");
    // Team plan: $30/mo * 5 (min seats) = $150
    // Fallback: Claude Pro $20 * 3 = $60
    expect(result.currentSpend).toBe(150);
    expect(result.suggestedSpend).toBe(60);
    expect(result.totalSavings).toBe(90);
    expect(result.breakdown[0].type).toBe("ghost_seats");
  });

  it("4. handles Enterprise / Custom Pricing correctly", () => {
    const result = calculateSavings("Cursor", 10, "Enterprise", "monthly");
    expect(result.currentSpend).toBe(0);
    expect(result.suggestedSpend).toBe(0);
    expect(result.totalSavings).toBe(0);
    expect(result.recommendation).toContain("custom/contact-sales pricing");
  });

  it("5. warns on incompatible plan limits", () => {
    const result = calculateSavings("Claude", 3, "Free", "monthly");
    expect(result.currentSpend).toBe(0);
    expect(result.breakdown[0].type).toBe("incompatible_plan");
    expect(result.recommendation).toContain("Incompatible Plan");
  });
});
