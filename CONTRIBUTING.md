# Contributing to FinTrack

Thank you for your interest in contributing to FinTrack! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v10.32.1) - Required package manager
- Docker & Docker Compose (for local database)
- A Firebase Project (for Auth)

### Setting Up Development Environment

1. **Fork and Clone**

   ```bash
   # Replace YOUR_USERNAME with your GitHub username after forking
   git clone https://github.com/YOUR_USERNAME/financial_tracker.git
   cd financial_tracker
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your Firebase and NocoDB credentials
   ```

4. **Start Infrastructure**

   ```bash
   cd infrastructure/docker
   docker-compose up -d
   cd ../..
   ```

5. **Start Development Servers**

   ```bash
   # Terminal 1: Backend
   pnpm run dev

   # Terminal 2: Frontend
   pnpm vite
   ```

## Development Workflow

We follow a **fork and pull** workflow:

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make Your Changes**

   - Follow our coding standards (see [AGENTS.md](AGENTS.md))
   - Write or update tests as needed
   - Update documentation if applicable

3. **Test Your Changes**

   ```bash
   # Backend tests
   pnpm test

   # Frontend tests
   pnpm run test:ui

   # Linting
   pnpm run lint:all

   # Build check
   pnpm run build
   ```

4. **Commit Your Changes**

   We follow [Conventional Commits](https://www.conventionalcommits.org/):

   ```text
   feat: Add new budget forecasting feature
   fix: Resolve CSV import date parsing issue
   docs: Update API endpoint documentation
   test: Add tests for transaction service
   refactor: Simplify category filtering logic
   chore: Update dependencies
   ```

5. **Push and Create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Process

1. **Before Submitting**

   - Ensure all tests pass
   - Run linting and fix any issues
   - Update relevant documentation
   - Rebase on latest `main` branch

2. **PR Requirements**

   - Fill out the PR template completely
   - Link related issues with `Fixes #123` or `Closes #456`
   - Request review from maintainers
   - Respond to review feedback promptly

3. **Review Process**

   - PRs require at least one approval
   - All CI checks must pass
   - Address all review comments before merging

## Coding Standards

### JavaScript/Vue (Frontend)

- Use Vue 3 Composition API with `<script setup>` syntax
- Use arrow functions
- Use `const` > `let`, never `var`
- Async/await only, never `.then()` chains
- Components: PascalCase.vue
- Composables: camelCase with `use` prefix (e.g., `useFinance.js`)
- Views: PascalCase with `View` suffix (e.g., `DashboardView.vue`)

### JavaScript (Backend)

- All files: camelCase.js
- Services layer required for complex logic
- Controllers handle HTTP only
- Use `catchAsync` wrapper for async controllers
- Winston for logging

### Example Structure

```javascript
// Backend Controller - camelCase.js
const getTransactions = catchAsync(async (req, res) => {
  const transactions = await transactionService.getAll(req.user.id);
  res.json({ success: true, data: transactions });
});

// Frontend Component - PascalCase.vue
<script setup>
import { ref, computed } from 'vue';
import { useTransactionStore } from '@/stores/transactions.js';

const store = useTransactionStore();
const filteredTransactions = computed(() => store.filtered);
</script>
```

### Linting

We use several linters to maintain code quality:

```bash
# Fix JavaScript/Vue/JSON
pnpm exec eslint '**/*.{js,mjs,vue}' --fix

# Fix CSS
pnpm exec stylelint 'frontend/src/**/*.css' --fix

# Fix Markdown
pnpm exec markdownlint '**/*.md' --fix

# Run all linters
pnpm run lint:all
```

**Always run auto-fixers before manual fixes!**

## Testing

### Backend Tests (Mocha + Sinon)

Located in `backend/tests/`:

```bash
pnpm test
```

### Frontend Tests (Vitest + Vue Test Utils)

```bash
pnpm run test:ui
```

### Test-Driven Development (TDD)

For new features:

1. **Red**: Write failing test
2. **Green**: Write minimum code to pass
3. **Refactor**: Improve while tests pass

### Code Coverage

We aim for:

- Core services: >80% coverage
- Controllers: >70% coverage
- Critical paths: 100% coverage

## Reporting Bugs

1. **Check existing issues** first
2. **Use the bug report template**
3. **Provide:**

   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, browser, OS)
   - Screenshots/logs if applicable

## Requesting Features

1. **Check existing issues** and discussions
2. **Use the feature request template**
3. **Describe:**

   - The problem you're solving
   - Your proposed solution
   - Alternatives considered
   - Component/area affected

## Questions?

- Join [GitHub Discussions](https://github.com/niyazmft/financial_tracker/discussions)
- Open an issue with the `question` label
- Review [AGENTS.md](AGENTS.md) for architectural details

## Recognition

Contributors will be:

- Listed in release notes
- Acknowledged in CONTRIBUTORS.md (coming soon)
- Credited in relevant documentation

Thank you for contributing to FinTrack! 🚀
