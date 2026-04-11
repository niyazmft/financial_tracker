🎯 **What:**
The `processUpcomingPayments` and `processAllPlans` functions in `frontend/src/services/installmentProcessor.js` lacked complete branch coverage. Specifically, conditions for arrays with missing names (`item_name` and `category_name`), as well as undefined or null `installment_payment` fields, were not being tested. Furthermore, sorting equality cases were not robustly verified.

📊 **Coverage:**
- **Array fallbacks:** Verifies cases where an items array is provided but is missing `item_name`, and where a categories array is provided but is missing `category_name`.
- **Undefined calculations:** Tests how the functions process records when `installment_payment` is completely absent or explicitly set to `null` (ensuring we correctly fallback to `0`).
- **Sorting edge cases:** Validates the sorting behavior to ensure upcoming payments correctly sort chronologically first by year, and then by month if years are equal.

✨ **Result:**
Added unit tests that completely cover all untested branches in the target file. Test coverage for `installmentProcessor.js` increased to 100% statements, branches, and functions. Tests are clean and free of side effects.
