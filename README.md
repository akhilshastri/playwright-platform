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

### Run Smart Tests (Flow-Tagged Tests)

To run only tests linked to changed flows:

```bash
npm run test:smart
```

This command:
1. Detects files that have changed since the last commit
2. Identifies which flows have changed
3. Finds tests that are tagged with those flows
4. Also finds tests that import changed files (combining the functionality of `test:affected`)
5. Runs only the affected tests

This provides even more precision than the `test:affected` command, as it only runs tests that are explicitly tagged with the changed flows.

## Flow Tagging System

### Tagging Tests with Flows

You can tag tests with specific flows using metadata comments:

```typescript
// @flow loginFlow
describe('Login Tests', () => {
  // Your tests here
});
```

You can add multiple flow tags to a single test file:

```typescript
// @flow loginFlow
// @flow registrationFlow
describe('User Authentication Tests', () => {
  // Your tests here
});
```

### How It Works

The flow tagging system works by:

1. Using Git to detect which files have changed
2. Identifying which flows have changed based on file paths
3. Parsing test files to extract flow tags
4. Finding tests that are tagged with the changed flows
5. Also finding tests that import changed files
6. Running only the affected tests, grouped by feature team

## Example

If you make a change to `core/src/flows/loginFlow.ts`, the system will:

1. Detect that `core/src/flows/loginFlow.ts` has changed
2. Identify that the `loginFlow` has changed
3. Find all test files that are tagged with `@flow loginFlow`
4. Also find all test files that import this module
5. Run only those specific tests

This significantly speeds up the testing process when working on large projects with many tests, and provides more precision by only running tests that are explicitly linked to the changed flows.

## Extending for More Teams

To add a new team:

1. Create a new directory under `feature-teams/`
2. Add test files with flow tags
3. The smart test runner will automatically detect and run tests for the new team

## Optimization Suggestions

1. **Caching**: Cache the mapping between tests and flows to avoid re-parsing all test files on each run
2. **Parallel Execution**: Run tests in parallel across teams to speed up execution
3. **Flow Dependency Graph**: Build a dependency graph of flows to detect indirect changes
4. **UI Integration**: Create a UI to visualize test coverage and flow dependencies
5. **CI Integration**: Integrate with CI/CD pipelines to run only affected tests on pull requests
