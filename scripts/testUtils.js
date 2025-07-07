const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// Run tests for a specific team
function runTestsForTeam(team, tests, originalDir) {
  return new Promise((resolve, reject) => {
    console.log(`Running tests for ${team}...`);
    
    try {
      // Change to team directory
      const teamDir = path.join(__dirname, '..', 'feature-teams', team);
      process.chdir(teamDir);

      // Build the tests first
      execSync('npm run build', { stdio: 'inherit' });

      // Run only the affected tests
      const testPaths = tests.map(t => t.replace('.ts', '.js').replace(`feature-teams/${team}/`, 'dist/'));
      
      // Use spawn instead of execSync to run tests in parallel
      const mochaProcess = spawn('npx', ['mocha', ...testPaths], { 
        stdio: 'inherit',
        shell: true
      });

      mochaProcess.on('close', (code) => {
        // Return to original directory
        process.chdir(originalDir);
        
        if (code === 0) {
          console.log(`Tests for ${team} completed successfully`);
          resolve();
        } else {
          console.error(`Tests for ${team} failed with code ${code}`);
          resolve(); // Resolve anyway to continue with other teams
        }
      });

      mochaProcess.on('error', (error) => {
        console.error(`Error running tests for ${team}:`, error.message);
        process.chdir(originalDir);
        resolve(); // Resolve anyway to continue with other teams
      });
    } catch (error) {
      console.error(`Error setting up tests for ${team}:`, error.message);
      process.chdir(originalDir);
      resolve(); // Resolve anyway to continue with other teams
    }
  });
}

// Run the tests in parallel using all available CPU cores
async function runTests(testsToRun, description = 'affected') {
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

  // Get the number of available CPU cores
  const numCores = os.cpus().length;
  console.log(`Running tests in parallel using ${numCores} CPU cores`);

  // Save original directory
  const originalDir = process.cwd();
  
  // Create an array of team test tasks
  const teamTasks = Array.from(testsByTeam.entries()).map(([team, tests]) => {
    return { team, tests };
  });
  
  // Process teams in parallel with a limit based on CPU cores
  const runningTasks = [];
  const completedTeams = new Set();
  
  // Process teams in batches based on CPU cores
  while (teamTasks.length > 0 || runningTasks.length > 0) {
    // Fill up to numCores tasks
    while (runningTasks.length < numCores && teamTasks.length > 0) {
      const task = teamTasks.shift();
      const promise = runTestsForTeam(task.team, task.tests, originalDir)
        .then(() => {
          completedTeams.add(task.team);
          // Remove from running tasks
          const index = runningTasks.indexOf(promise);
          if (index !== -1) {
            runningTasks.splice(index, 1);
          }
        });
      runningTasks.push(promise);
    }
    
    // Wait for at least one task to complete if we have running tasks
    if (runningTasks.length > 0) {
      await Promise.race(runningTasks);
    }
  }
  
  // Ensure we're back in the original directory
  process.chdir(originalDir);
  
  console.log(`Completed running tests for all teams: ${Array.from(completedTeams).join(', ')}`);
}

module.exports = {
  getChangedFiles,
  mapCoreFilesToImportPaths,
  findAllTestFiles,
  findTestsForChangedImports,
  runTests
};