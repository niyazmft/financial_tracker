## 2024-06-01 - Add rate limiting to password reset endpoint

**Vulnerability:** Missing rate limiting on sensitive public endpoints (e.g., `/api/request-password-reset`) could lead to Denial of Service (DoS) attacks and user enumeration.
**Learning:** Public endpoints that handle sensitive operations like password reset requests must use the custom `createRateLimiter` middleware to prevent abuse.
**Prevention:** Apply custom rate limiting to all public-facing authentication and sensitive operations endpoints.

## 2025-06-02 - Fix Insecure Direct Object Reference (IDOR) in Savings Goal API

**Vulnerability:** The `updateGoal` and `deleteGoal` endpoints in `backend/controllers/savingsGoalController.js` lacked authorization checks. While authentication was required (via `authenticateToken` middleware), the endpoints trusted the provided ID parameter blindly, allowing any authenticated user to modify or delete another user's savings goal by merely changing the `id` in the API path.
**Learning:** This reveals a recurring pattern where CRUD controllers rely on the NocoDB service layer without asserting data ownership against `req.user.uid` for existing records. Even if the service executes a mutation properly, the controller is responsible for business logic checks unless enforced centrally. Missing ownership verification on updates and deletes is a textbook IDOR vulnerability.
**Prevention:** Always follow a "retrieve, verify, mutate" pattern for existing records. Before any update or delete action, fetch the existing record (e.g., `nocodbService.getRecordById`), and strictly compare the owner ID (`existingRecord.user_id`) against the authenticated user ID (`req.user.uid`). Proceed with the mutation only if there is a verified match, otherwise reject with a 403 Forbidden.

## 2024-06-06 - [Insecure Direct Object Reference (IDOR) in Subscriptions API]

**Vulnerability:** Missing authorization checks in the `updateSubscription` and `deleteSubscription` endpoints. The endpoints passed the ID directly to the service layer without verifying if the authenticated user (`req.user.uid`) actually owned the subscription record, allowing any authenticated user to modify or delete any subscription by guessing its ID.
**Learning:** When abstracting database operations into a service layer (e.g., `subscriptionService.js`), it's crucial to maintain authorization boundaries. The controller must fetch the existing record and verify ownership (`record.user_id === req.user.uid`) before delegating the update/delete operation to the service.
**Prevention:** Implement strict ownership verification in controllers before invoking service methods for updates or deletions, returning `403 Forbidden` if the `user_id` doesn't match the authenticated user.
