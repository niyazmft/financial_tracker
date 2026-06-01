## 2024-06-01 - Add rate limiting to password reset endpoint

**Vulnerability:** Missing rate limiting on sensitive public endpoints (e.g., `/api/request-password-reset`) could lead to Denial of Service (DoS) attacks and user enumeration.
**Learning:** Public endpoints that handle sensitive operations like password reset requests must use the custom `createRateLimiter` middleware to prevent abuse.
**Prevention:** Apply custom rate limiting to all public-facing authentication and sensitive operations endpoints.
