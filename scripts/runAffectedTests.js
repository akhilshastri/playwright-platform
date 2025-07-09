const path = require('path');
const { 
  getChangedFiles, 
  mapCoreFilesToImportPaths, 
  findTestsForChangedImports, 
  runTests 
} = require('./testUtils');

// Main function
const main = () => {
  const changedFiles = getChangedFiles();
  console.log('Changed files:', changedFiles);

  const importPathMap = mapCoreFilesToImportPaths(changedFiles);
  console.log('Import paths to check:', Array.from(importPathMap.keys()));

  const affectedTests = findTestsForChangedImports(importPathMap);
  console.log('Affected tests:', affectedTests);

  runTests(affectedTests, 'affected');
}

main();
