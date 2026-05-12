# Automated Tests — Vantage

## 🛠️ How to run
Run `npm test` to execute the Jest suite.

## 📋 Test Coverage (`src/__tests__/auditEngine.test.ts`)
I wrote 5 surgical tests to ensure the Audit Engine is CFO-ready:

1. **Monthly Math Verification:** Confirms the engine correctly calculates the jump from monthly to annual billing for Claude Pro.
2. **Annual Cycle Safety:** Ensures that if a user is already on an annual plan, the engine doesn't "hallucinate" extra savings.
3. **Ghost Seat Detection:** Specifically tests the Claude Team plan minimums (5 seats) to ensure "seat leaks" are flagged.
4. **Enterprise Logic:** Handles custom pricing tiers gracefully by notifying the user that automated math isn't possible for "Contact Sales" plans.
5. **Incompatible Plan Warning:** Verifies that the engine catches logic errors (like trying to put 3 people on a Free plan) and warns the user.
