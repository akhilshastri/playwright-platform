const fs = require('fs');
const path = require('path');
const { 
  getChangedFiles, 
  mapCoreFilesToImportPaths, 
  findAllTestFiles,
  findTestsForChangedImports,
  runTests
} = require('./testUtils');

// Detect which flows have changed based on file changes
const detectChangedFlows = (changedFiles) => {
  const changedFlows = new Set();

  changedFiles.forEach(file => {
    // Check if the file is a flow file in the core directory
    if (file.startsWith('core/src/flows/') && file.endsWith('.ts')) {
      // Extract flow name from file path (e.g., core/src/flows/loginFlow.ts -> loginFlow)
      const flowName = path.basename(file, '.ts');
      changedFlows.add(flowName);
    }
  });

  return Array.from(changedFlows);
}

// Parse test files to extract flow tags
const parseFlowTags = (testFile) => {
  try {
    const content = fs.readFileSync(testFile, 'utf8');
    const flowTags = [];

    // Regular expression to match flow tags (e.g., // @flow loginFlow)
    const flowTagRegex = /\/\/\s*@flow\s+(\w+)/g;
    let match;

    while ((match = flowTagRegex.exec(content)) !== null) {
      flowTags.push(match[1]);
    }

    return flowTags;
  } catch (error) {
    console.error(`Error parsing flow tags in ${testFile}:`, error.message);
    return [];
  }
}

// Find tests that are tagged with the changed flows
const findTestsForChangedFlows = (changedFlows) => {
  if (changedFlows.length === 0) {
    return [];
  }

  const testFiles = findAllTestFiles();
  const testsToRun = new Set();

  testFiles.forEach(testFile => {
    const flowTags = parseFlowTags(testFile);

    // Check if any of the flow tags match the changed flows
    for (const flow of changedFlows) {
      if (flowTags.includes(flow)) {
        testsToRun.add(testFile);
        break;
      }
    }
  });

  return Array.from(testsToRun);
}

// Main function
const main = () => {
  const changedFiles = getChangedFiles();
  console.log('Changed files:', changedFiles);

  // Find tests based on flow tags
  const changedFlows = detectChangedFlows(changedFiles);
  console.log('Changed flows:', changedFlows);

  const testsFromFlowTags = findTestsForChangedFlows(changedFlows);
  console.log('Tests from flow tags:', testsFromFlowTags);

  // Find tests based on imports
  const importPathMap = mapCoreFilesToImportPaths(changedFiles);
  console.log('Import paths to check:', Array.from(importPathMap.keys()));

  const testsFromImports = findTestsForChangedImports(importPathMap);
  console.log('Tests from imports:', testsFromImports);

  // Combine both sets of tests
  const testsToRun = [...new Set([...testsFromFlowTags, ...testsFromImports])];
  console.log('Combined tests to run:', testsToRun);

  runTests(testsToRun, 'linked to changed flows');
}

main();
