const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get changed files since last commit or between branches
function getChangedFiles() {
  try {
    // If comparing with another branch is needed, this can be modified
    const output = execSync('git diff --name-only HEAD~1 HEAD').toString();
    return output.split('\n').filter(file => file.trim() !== '');
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

// Find tests that import the changed files
function findAffectedTests(importPathMap) {
  const affectedTests = new Set();
  
  // Recursively search through feature-teams directories
  function searchDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        searchDirectory(fullPath);
      } else if (entry.name.endsWith('.test.ts')) {
        // Check if test file imports any of the changed files
        const content = fs.readFileSync(fullPath, 'utf8');
        
        for (const [importPath] of importPathMap) {
          if (content.includes(importPath)) {
            affectedTests.add(fullPath);
            break;
          }
        }
      }
    }
  }
  
  // Start search from feature-teams directory
  searchDirectory(path.join(__dirname, '..', 'feature-teams'));
  
  return Array.from(affectedTests);
}

// Run the affected tests
function runAffectedTests(affectedTests) {
  if (affectedTests.length === 0) {
    console.log('No affected tests found.');
    return;
  }
  
  console.log(`Found ${affectedTests.length} affected tests.`);
  
  // Group tests by team
  const testsByTeam = new Map();
  
  affectedTests.forEach(testPath => {
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

// Main function
function main() {
  const changedFiles = getChangedFiles();
  console.log('Changed files:', changedFiles);
  
  const importPathMap = mapCoreFilesToImportPaths(changedFiles);
  console.log('Import paths to check:', Array.from(importPathMap.keys()));
  
  const affectedTests = findAffectedTests(importPathMap);
  console.log('Affected tests:', affectedTests);
  
  runAffectedTests(affectedTests);
}

main();