# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability within FinTrack, please help us fix it quickly and responsibly.

### How to Report

**Please DO NOT open a public issue** for security vulnerabilities. Instead:

1. **Email**: Send details to the repository owner at [contact via GitHub](https://github.com/niyazmft)
2. **Subject**: Use "[SECURITY] FinTrack Vulnerability Report" as the subject line
3. **Details**: Include:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Possible impact of the vulnerability
   - Any suggestions for remediation (if applicable)

### Response Timeline

- **Initial Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix Development**: Based on severity (critical: 30 days, high: 60 days)
- **Disclosure**: After fix is released, we will coordinate disclosure with you

### Scope

This security policy covers:

- Backend API vulnerabilities (Express.js, Node.js)
- Authentication/Authorization bypasses (Firebase)
- Data exposure or leakage
- Injection attacks (SQL via NocoDB, NoSQL)
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Insecure dependencies
- Configuration vulnerabilities

### Out of Scope

The following are generally not considered security issues:

- Social engineering attacks
- Physical access to user devices
- Issues requiring extensive user interaction
- Vulnerabilities in third-party services (Firebase, NocoDB) - please report to them directly

### Security Best Practices for Users

- Keep your Firebase credentials secure and never commit them
- Use strong passwords for your Firebase account
- Enable 2FA on your GitHub and Firebase accounts
- Keep dependencies updated (`pnpm audit`)
- Review code changes before deploying

## Security Measures in Place

- ✅ Automated dependency scanning (Dependabot)
- ✅ Secret scanning enabled
- ✅ CodeQL analysis for JavaScript/Vue
- ✅ Protected branches with required reviews
- ✅ Automated CI/CD with security checks
- ✅ Input validation on all API endpoints
- ✅ Firebase Authentication for secure access

## Acknowledgments

We appreciate the security research community's efforts in helping us maintain a secure project. Responsible disclosures will be acknowledged in our release notes (unless you prefer to remain anonymous).
