## 2024-06-01 - Add rate limiting to password reset endpoint

**Vulnerability:** Missing rate limiting on sensitive public endpoints (e.g., `/api/request-password-reset`) could lead to Denial of Service (DoS) attacks and user enumeration.
**Learning:** Public endpoints that handle sensitive operations like password reset requests must use the custom `createRateLimiter` middleware to prevent abuse.
**Prevention:** Apply custom rate limiting to all public-facing authentication and sensitive operations endpoints.

## 2025-06-02 - Fix Insecure Direct Object Reference (IDOR) in Savings Goal API

**Vulnerability:** The `updateGoal` and `deleteGoal` endpoints in `backend/controllers/savingsGoalController.js` lacked authorization checks. While authentication was required (via `authenticateToken` middleware), the endpoints trusted the provided ID parameter blindly, allowing any authenticated user to modify or delete another user's savings goal by merely changing the `id` in the API path.
**Learning:** This reveals a recurring pattern where CRUD controllers rely on the NocoDB service layer without asserting data ownership against `req.user.uid` for existing records. Even if the service executes a mutation properly, the controller is responsible for business logic checks unless enforced centrally. Missing ownership verification on updates and deletes is a textbook IDOR vulnerability.
**Prevention:** Always follow a "retrieve, verify, mutate" pattern for existing records. Before any update or delete action, fetch the existing record (e.g., `nocodbService.getRecordById`), and strictly compare the owner ID (`existingRecord.user_id`) against the authenticated user ID (`req.user.uid`). Proceed with the mutation only if there is a verified match, otherwise reject with a 403 Forbidden.
