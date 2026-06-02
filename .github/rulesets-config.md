# GitHub Rulesets Configuration

This file documents the recommended rulesets for FinTrack.
Apply these via GitHub API or manually in the repository settings.

> **Note:** Push rulesets require GitHub Team/Enterprise for private repositories.

## Current Ruleset: Main Branch Quality Gate (ID: 14189885)

This ruleset is already configured via GitHub UI.

## RECOMMENDED: Secret Protection Push Ruleset

This blocks sensitive files from being committed.

> **Note:** Push rulesets only work on public repos with Free plan.

```json
{
  "name": "Block Sensitive Files",
  "target": "push",
  "enforcement": "active",
  "rules": [
    {
      "type": "file_path_restriction",
      "parameters": {
        "restricted_file_paths": [
          ".env",
          ".env.*",
          "!.env.example",
          "service-account.json",
          "*-key.json",
          "key.json",
          "*.pem",
          "*.p12",
          "*.key",
          "**/service-account.json",
          "**/*.pem",
          "**/*.p12",
          "**/*.key"
        ]
      }
    }
  ]
}
```

## RECOMMENDED: Commit Message Ruleset

Enforces conventional commit format.

```json
{
  "name": "Commit Message Standards",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH", "refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "commit_message_pattern",
      "parameters": {
        "name": "Conventional Commits",
        "pattern": "^(feat|fix|docs|style|refactor|test|chore|ci|build|perf)(\\(.+\\))?: .+",
        "negate": false,
        "operator": "regex"
      }
    }
  ]
}
```

## RECOMMENDED: Tag Protection Ruleset

Protects release tags.

```json
{
  "name": "Release Tag Protection",
  "target": "tag",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/tags/v*"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "update"
    }
  ]
}
```

## CLI Commands to Apply These Rulesets

To create a new ruleset via GitHub CLI:

```bash
gh api repos/{owner}/{repo}/rulesets --method POST --input ruleset.json
```

To update an existing ruleset:

```bash
gh api repos/{owner}/{repo}/rulesets/{id} --method PUT --input ruleset.json
```

To list all rulesets:

```bash
gh api repos/{owner}/{repo}/rulesets
```

## Manual Setup Instructions

1. Go to: `https://github.com/{owner}/{repo}/settings/rules`
2. Click "New ruleset" → "New branch ruleset"
3. Configure based on the JSON above
4. Set enforcement to "Active"

## Alternative: GitHub API

See GitHub API documentation:

- [Repository Rules API](https://docs.github.com/en/rest/repos/rules)
- [Create a Repository Ruleset](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset)
