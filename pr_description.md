🧪 Add missing error tests for validateAndFormatAmount

🎯 **What:** Added tests to cover the `validateAndFormatAmount` function in `backend/utils/validationUtils.js`, focusing on missing amount errors, non-numeric errors, and amounts exceeding boundaries. Added happy-path tests as well.
📊 **Coverage:** Covered missing amounts (null, undefined, ''), invalid non-numeric numbers ('abc', 'NaN'), amounts that exceed maximum limits (> 1000000), valid amounts formatted as numbers and strings, and numbers with currency symbols and spaces.
✨ **Result:** Test coverage improved for the `validateAndFormatAmount` utility method, assuring it accurately catches error cases and limits, making it more reliable against future regressions.
