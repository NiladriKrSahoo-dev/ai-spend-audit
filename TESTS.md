# Automated Tests — Vantage

## 🛠️ How to run
Run `npm test` to execute the Jest suite.

## 📋 Test Coverage (`src/__tests__/audit.test.js`)
1. **`calculateSavings_Basic`**: Confirms $0 waste for a 1-seat Pro plan.
2. **`calculateSavings_Annual`**: Confirms 20% savings detection when switching from monthly.
3. **`calculateSavings_GhostSeats`**: Confirms waste detection when team size < plan minimum.
4. **`calculateSavings_DowngradePath`**: Confirms the engine recommends individual seats if a Team plan is overkill.
5. **`calculateSavings_ZeroSeats`**: Confirms the engine handles empty states without crashing.
