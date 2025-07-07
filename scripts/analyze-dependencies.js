#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing dependencies...\n');

// Install and run depcheck
try {
  console.log('Installing depcheck...');
  execSync('npm install -g depcheck', { stdio: 'pipe' });
  
  console.log('Running dependency analysis...\n');
  const result = execSync('depcheck --json', { encoding: 'utf8' });
  const analysis = JSON.parse(result);
  
  console.log('📦 DEPENDENCY ANALYSIS REPORT\n');
  console.log('=' .repeat(50));
  
  // Unused dependencies
  if (analysis.dependencies && analysis.dependencies.length > 0) {
    console.log('\n❌ UNUSED DEPENDENCIES:');
    analysis.dependencies.forEach(dep => {
      console.log(`  - ${dep}`);
    });
    
    console.log('\n💡 To remove unused dependencies, run:');
    console.log(`npm uninstall ${analysis.dependencies.join(' ')}`);
  } else {
    console.log('\n✅ No unused dependencies found!');
  }
  
  // Unused dev dependencies
  if (analysis.devDependencies && analysis.devDependencies.length > 0) {
    console.log('\n❌ UNUSED DEV DEPENDENCIES:');
    analysis.devDependencies.forEach(dep => {
      console.log(`  - ${dep}`);
    });
    
    console.log('\n💡 To remove unused dev dependencies, run:');
    console.log(`npm uninstall ${analysis.devDependencies.join(' ')}`);
  } else {
    console.log('\n✅ No unused dev dependencies found!');
  }
  
  // Missing dependencies
  if (analysis.missing && Object.keys(analysis.missing).length > 0) {
    console.log('\n⚠️  MISSING DEPENDENCIES:');
    Object.entries(analysis.missing).forEach(([dep, files]) => {
      console.log(`  - ${dep} (used in: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''})`);
    });
    
    console.log('\n💡 To install missing dependencies, run:');
    console.log(`npm install ${Object.keys(analysis.missing).join(' ')}`);
  } else {
    console.log('\n✅ No missing dependencies found!');
  }
  
  // Invalid files
  if (analysis.invalidFiles && Object.keys(analysis.invalidFiles).length > 0) {
    console.log('\n⚠️  FILES WITH SYNTAX ERRORS:');
    Object.entries(analysis.invalidFiles).forEach(([file, error]) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
  
  // Invalid directories
  if (analysis.invalidDirs && Object.keys(analysis.invalidDirs).length > 0) {
    console.log('\n⚠️  INVALID DIRECTORIES:');
    Object.entries(analysis.invalidDirs).forEach(([dir, error]) => {
      console.log(`  - ${dir}: ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Analysis complete!');
  
} catch (error) {
  console.error('Error running dependency analysis:', error.message);
  console.log('\nTrying alternative approach...');
  
  // Manual basic analysis
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log('\n📦 BASIC DEPENDENCY LIST\n');
  console.log('Dependencies:', dependencies.length);
  console.log('Dev Dependencies:', devDependencies.length);
  
  console.log('\n💡 To perform detailed analysis, install depcheck globally:');
  console.log('npm install -g depcheck');
  console.log('Then run: depcheck');
}
