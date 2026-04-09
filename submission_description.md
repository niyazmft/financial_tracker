🧪 Add tests for dateUtils.js

🎯 **What:** The testing gap addressed
This PR introduces unit tests for the `backend/utils/dateUtils.js` module, which previously lacked testing. It verifies the behavior of `getLookaheadDates` and `formatDateForDisplay` functions. It also fixes test environment setup by adding `cross-env` to correctly pass required dummy variables in order for `pnpm run test` to work correctly.

📊 **Coverage:** What scenarios are now tested

- `getLookaheadDates`: Tests default duration (30 days), specified durations, string inputs, and negative durations.
- `formatDateForDisplay`: Tests valid Date objects, valid date strings, strings without time, timestamps, invalid date strings, and null/undefined values.

✨ **Result:** The improvement in test coverage
We now have full coverage for pure date functions ensuring regressions aren't introduced in the future when changes are made to how we display or interact with dates. Test runner environment issues have also been fixed for `dateUtils` by adjusting how tests are executed.
