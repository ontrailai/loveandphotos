#!/usr/bin/env node

/**
 * SafeAvatar Diagnostics Test Runner
 * Runs all SafeAvatar diagnostic tests and generates a report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m'
};

const log = (color, message) => console.log(`${COLORS[color]}${message}${COLORS.RESET}`);
const logSection = (title) => {
  console.log('\n' + '='.repeat(60));
  log('CYAN', `  ${title}`);
  console.log('='.repeat(60));
};

const runCommand = (command, description) => {
  log('BLUE', `\n🔧 ${description}...`);
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000 // 30 second timeout
    });
    log('GREEN', '✅ SUCCESS');
    return { success: true, output, error: null };
  } catch (error) {
    log('RED', '❌ FAILED');
    console.error(error.stdout || error.message);
    return { success: false, output: null, error: error.message };
  }
};

const checkFileExists = (filePath, description) => {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log('GREEN', `✅ ${description}: ${path.basename(filePath)}`);
  } else {
    log('RED', `❌ ${description}: ${path.basename(filePath)} (missing)`);
  }
  return exists;
};

const main = async () => {
  logSection('SafeAvatar Diagnostic Test Suite');

  const results = {
    filesCheck: [],
    unitTests: null,
    integrationTests: null,
    dataAnalysisTests: null,
    e2eTests: null,
    overallSuccess: false
  };

  // Check if all diagnostic files exist
  logSection('File Existence Check');

  const diagnosticFiles = [
    ['tests/safeavatar-debug-console.js', 'Browser Console Script'],
    ['src/components/shared/SafeAvatar.jsx', 'Enhanced SafeAvatar Component'],
    ['tests/unit/SafeAvatar.test.js', 'Unit Tests'],
    ['tests/integration/browse-avatar-integration.test.js', 'Integration Tests'],
    ['tests/e2e/browse-thumbnails.spec.js', 'E2E Tests'],
    ['tests/analysis/browse-data-transformation.test.js', 'Data Analysis Tests'],
    ['tests/README-SafeAvatar-Diagnostics.md', 'Documentation']
  ];

  diagnosticFiles.forEach(([filePath, description]) => {
    const exists = checkFileExists(filePath, description);
    results.filesCheck.push({ filePath, description, exists });
  });

  const allFilesExist = results.filesCheck.every(f => f.exists);

  if (!allFilesExist) {
    log('RED', '\n❌ Some diagnostic files are missing. Please create them first.');
    return;
  }

  // Check if test commands exist
  logSection('Testing Environment Check');

  const hasVitest = runCommand('npx vitest --version', 'Check Vitest installation');
  const hasPlaywright = runCommand('npx playwright --version', 'Check Playwright installation');

  if (!hasVitest.success) {
    log('YELLOW', '⚠️ Vitest not found. Install with: npm install -D vitest @testing-library/react @testing-library/jest-dom');
  }

  if (!hasPlaywright.success) {
    log('YELLOW', '⚠️ Playwright not found. Install with: npm install -D @playwright/test');
  }

  // Run unit tests
  if (hasVitest.success) {
    logSection('Unit Tests');
    results.unitTests = runCommand(
      'npx vitest run tests/unit/SafeAvatar.test.js',
      'Running SafeAvatar unit tests'
    );
  }

  // Run integration tests
  if (hasVitest.success) {
    logSection('Integration Tests');
    results.integrationTests = runCommand(
      'npx vitest run tests/integration/browse-avatar-integration.test.js',
      'Running Browse avatar integration tests'
    );
  }

  // Run data analysis tests
  if (hasVitest.success) {
    logSection('Data Transformation Analysis');
    results.dataAnalysisTests = runCommand(
      'npx vitest run tests/analysis/browse-data-transformation.test.js',
      'Running data transformation analysis tests'
    );
  }

  // Run E2E tests (only if dev server is available)
  if (hasPlaywright.success) {
    logSection('E2E Tests');
    log('BLUE', '\n🔧 Checking if dev server is running...');

    try {
      // Check if dev server is running
      execSync('curl -f http://localhost:5173 > /dev/null 2>&1', { timeout: 3000 });
      log('GREEN', '✅ Dev server is running');

      results.e2eTests = runCommand(
        'npx playwright test tests/e2e/browse-thumbnails.spec.js --headed=false',
        'Running E2E thumbnail loading tests'
      );
    } catch {
      log('YELLOW', '⚠️ Dev server not running. Start with: npm run dev');
      log('YELLOW', '   E2E tests will be skipped');
    }
  }

  // Generate summary report
  logSection('Test Results Summary');

  const testResults = [
    ['Unit Tests', results.unitTests],
    ['Integration Tests', results.integrationTests],
    ['Data Analysis Tests', results.dataAnalysisTests],
    ['E2E Tests', results.e2eTests]
  ];

  let passedTests = 0;
  let totalTests = 0;

  testResults.forEach(([name, result]) => {
    if (result === null) {
      log('YELLOW', `⏭️ ${name}: SKIPPED`);
    } else if (result.success) {
      log('GREEN', `✅ ${name}: PASSED`);
      passedTests++;
      totalTests++;
    } else {
      log('RED', `❌ ${name}: FAILED`);
      totalTests++;
    }
  });

  results.overallSuccess = passedTests === totalTests && totalTests > 0;

  // Next steps recommendations
  logSection('Next Steps');

  if (results.overallSuccess) {
    log('GREEN', '🎉 All diagnostic tests passed!');
    log('WHITE', '\nTo investigate SafeAvatar issues:');
    log('WHITE', '1. Navigate to /photographers page in browser');
    log('WHITE', '2. Open developer console');
    log('WHITE', '3. Copy and paste: tests/safeavatar-debug-console.js');
    log('WHITE', '4. Review the automatic analysis output');
  } else {
    log('RED', '⚠️ Some tests failed. Recommendations:');

    if (!results.unitTests?.success) {
      log('WHITE', '• Fix SafeAvatar component logic issues');
    }
    if (!results.integrationTests?.success) {
      log('WHITE', '• Check Browse.jsx data transformation');
    }
    if (!results.dataAnalysisTests?.success) {
      log('WHITE', '• Validate URL construction logic');
    }
    if (!results.e2eTests?.success) {
      log('WHITE', '• Test in real browser environment');
    }
  }

  log('WHITE', '\nFor manual debugging:');
  log('WHITE', '• Check browser console for [SafeAvatar Debug] messages');
  log('WHITE', '• Monitor Network tab for failed image requests');
  log('WHITE', '• Use browser console diagnostic script for detailed analysis');

  // Save results to file
  const reportPath = 'tests/diagnostic-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log('BLUE', `\n📊 Full results saved to: ${reportPath}`);

  process.exit(results.overallSuccess ? 0 : 1);
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('RED', `\n💥 Uncaught error: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log('RED', `\n💥 Unhandled rejection: ${error.message}`);
  process.exit(1);
});

main().catch(error => {
  log('RED', `\n💥 Script failed: ${error.message}`);
  process.exit(1);
});