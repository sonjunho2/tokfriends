# API Usage CI Checklist

- [ ] Regenerate `_contract/client-usage-app.json` after API changes (`node scripts/analyzeApiUsage.js`).
- [ ] Review `_contract/diff-report-app.json` to keep client usage aligned with `_contract/openapi.yaml`.
- [ ] Verify environment variables (`EXPO_PUBLIC_API_BASE_URL`) for the target build profile.
- [ ] Run `npm run check:api` to confirm backend connectivity.
- [ ] Resolve 43 unmatched client endpoints (or update the contract).
- [ ] Resolve 38 unused contract endpoints (or document why they are unused).
