# FinTrack GitHub Configuration

This directory contains GitHub-specific configuration files for the FinTrack project.

## Structure

```text
.github/
├── workflows/          # GitHub Actions workflows
│   ├── ci.yml         # Main CI/CD pipeline
│   └── codeql.yml     # Security scanning (NEW)
├── ISSUE_TEMPLATE/     # Issue templates
│   ├── bug_report.yml       # Bug report form
│   ├── feature_request.yml  # Feature request form
│   └── config.yml           # Issue template configuration
├── PULL_REQUEST_TEMPLATE.md  # PR template
├── dependabot.yml      # Dependency update automation (NEW)
└── rulesets-config.md  # Ruleset documentation (NEW)
```

## Workflows

### CI Pipeline (`workflows/ci.yml`)
Runs on every push and PR to `main`:
- Installs dependencies with pnpm
- Runs linting (ESLint, Stylelint, Markdownlint)
- Runs backend tests (Mocha)
- Runs frontend tests (Vitest)
- Builds the application

### CodeQL Analysis (`workflows/codeql.yml`)
Security scanning that runs:
- On every push to `main`
- On every PR to `main`
- Weekly (Monday 9 AM UTC)

## Issue Templates

Located in `ISSUE_TEMPLATE/`:

- **Bug Report** (`bug_report.yml`): Structured form for reporting bugs
- **Feature Request** (`feature_request.yml`): Form for proposing new features
- **Config** (`config.yml`): Directs users to discussions for questions

## Pull Request Template

`PULL_REQUEST_TEMPLATE.md` provides a checklist for contributors including:
- Change type selection
- Testing checklist
- Code review checklist
- Security considerations

## Dependabot

`dependabot.yml` configures automated dependency updates:
- **npm**: Weekly updates for Node.js packages
- **github-actions**: Weekly updates for GitHub Actions

Updates are grouped by minor/patch vs major versions.

## Repository Settings

### Required Settings (via GitHub UI)

1. **Settings** → **General**
   - ✅ Allow squash merging (recommended)
   - ❌ Disable merge commits (cleaner history)
   - ✅ Automatically delete head branches

2. **Settings** → **Security**
   - ✅ Enable "Secret scanning"
   - ✅ Enable "Secret scanning push protection"
   - ✅ Enable "Dependabot alerts"
   - ✅ Enable "Dependabot security updates"

3. **Settings** → **Rules** → **Rulesets**
   Current: "Main Branch Quality Gate" (ID: 14189885)
   - Requires status checks
   - Requires linear history
   - Requires PRs for main branch

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on:
- Development workflow
- Coding standards
- Testing requirements
- PR process

## Security

See [SECURITY.md](../SECURITY.md) for:
- Vulnerability reporting process
- Security measures in place
- Security best practices

## Code of Conduct

See [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) for community standards.

---

**Note**: These configurations follow GitHub community health best practices and align with industry standards for open source projects.
