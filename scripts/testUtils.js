const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get changed files since last commit or between branches
function getChangedFiles() {
  try {
    // If comparing with another branch is needed, this can be modified
    const output = execSync('git diff --name-only HEAD~1 HEAD').toString();
    // Filter out empty lines and lines containing only the '~' character
    // which git emits when the diff is huge
    return output.split('\n').filter(file => {
      const trimmed = file.trim();
      return trimmed !== '' && trimmed !== '~';
    });
  } catch (error) {
    console.error('Error getting changed files:', error.message);
    return [];
  }
}

// Map core files to their import paths
function mapCoreFilesToImportPaths(changedFiles) {
  const importPathMap = new Map();

  changedFiles.forEach(file => {
    if (file.startsWith('core/src/')) {
      // Convert file path to import path
      // e.g., core/src/flows/loginFlow.ts -> playwright-core-utils/dist/flows/loginFlow
      const relativePath = file.replace('core/src/', '').replace('.ts', '');
      const importPath = `playwright-core-utils/dist/${relativePath}`;
      importPathMap.set(importPath, file);
    }
  });

  return importPathMap;
}

// Find all test files in the project
function findAllTestFiles() {
  const testFiles = [];

  function searchDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        searchDirectory(fullPath);
      } else if (entry.name.endsWith('.test.ts')) {
        testFiles.push(fullPath);
      }
    }
  }

  // Start search from feature-teams directory
  searchDirectory(path.join(__dirname, '..', 'feature-teams'));

  return testFiles;
}

// Find tests that import the changed files
function findTestsForChangedImports(importPathMap) {
  if (importPathMap.size === 0) {
    return [];
  }

  const testFiles = findAllTestFiles();
  const testsToRun = new Set();

  testFiles.forEach(testFile => {
    try {
      const content = fs.readFileSync(testFile, 'utf8');

      for (const [importPath] of importPathMap) {
        if (content.includes(importPath)) {
          testsToRun.add(testFile);
          break;
        }
      }
    } catch (error) {
      console.error(`Error checking imports in ${testFile}:`, error.message);
    }
  });

  return Array.from(testsToRun);
}

// Run the tests
function runTests(testsToRun, description = 'affected') {
  if (testsToRun.length === 0) {
    console.log(`No ${description} tests found.`);
    return;
  }

  console.log(`Found ${testsToRun.length} ${description} tests.`);

  // Group tests by team
  const testsByTeam = new Map();

  testsToRun.forEach(testPath => {
    // Extract team name from path (e.g., feature-teams/team-a/tests/example.test.ts -> team-a)
    const match = testPath.match(/feature-teams[\/\\]([^\/\\]+)/);
    if (match && match[1]) {
      const team = match[1];
      if (!testsByTeam.has(team)) {
        testsByTeam.set(team, []);
      }
      testsByTeam.get(team).push(testPath);
    }
  });

  // Run tests for each team
  for (const [team, tests] of testsByTeam) {
    console.log(`Running tests for ${team}...`);

    try {
      // Change to team directory
      const teamDir = path.join(__dirname, '..', 'feature-teams', team);
      process.chdir(teamDir);

      // Build the tests first
      execSync('npm run build', { stdio: 'inherit' });

      // Run only the affected tests
      const testPaths = tests.map(t => t.replace('.ts', '.js').replace(`feature-teams/${team}/`, 'dist/'));
      execSync(`npx mocha ${testPaths.join(' ')}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error running tests for ${team}:`, error.message);
    }
  }
}

module.exports = {
  getChangedFiles,
  mapCoreFilesToImportPaths,
  findAllTestFiles,
  findTestsForChangedImports,
  runTests
};