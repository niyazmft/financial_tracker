🚨 Severity: HIGH
💡 Vulnerability: Missing rate limiting on sensitive public endpoints (e.g., `/api/request-password-reset`) which could lead to Denial of Service (DoS) attacks and user enumeration/email flooding.
🎯 Impact: An attacker could write a script to rapidly request password resets, causing a denial of service on the email-sending service or enabling the enumeration of existing accounts through inference or brute-force tracking.
🔧 Fix: Added custom in-memory `createRateLimiter` middleware (configured for 5 requests per 15 minutes) to the `/request-password-reset` route.
✅ Verification: Tested the application manually to verify normal requests work, and test suites (`pnpm test` / `pnpm lint`) are passing. Sending more than 5 password reset requests within a 15-minute window will now be rejected.
