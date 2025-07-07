# Playwright Platform

A monorepo for Playwright-based testing infrastructure, containing core utilities and feature team tests.

## Project Structure

- `core/`: Core utilities and flows used by all feature teams
- `feature-teams/`: Individual feature team test suites
- `scripts/`: Utility scripts for the project

## Running Tests

### Run All Tests

To run all tests across all feature teams:

```bash
npm test
```

### Run Only Affected Tests

To run only tests affected by recent changes:

```bash
npm run test:affected
```

This command:
1. Detects files that have changed since the last commit
2. Identifies test files that import the changed files
3. Runs only the affected tests

This is particularly useful when making changes to core flows or utilities, as it will only run tests that depend on the changed files.

## How It Works

The change detection system works by:

1. Using Git to detect which files have changed
2. Mapping core file paths to their import paths in test files
3. Scanning all test files to find those that import the changed files
4. Running only the affected tests, grouped by feature team

## Example

If you make a change to `core/src/flows/loginFlow.ts`, the system will:

1. Detect that `core/src/flows/loginFlow.ts` has changed
2. Map this to the import path `playwright-core-utils/dist/flows/loginFlow`
3. Find all test files that import this module
4. Run only those specific tests

This significantly speeds up the testing process when working on large projects with many tests.