#!/usr/bin/env node

/**
 * Prebuild validation script to verify all aliased imports resolve correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Define the aliases from vite.config.js
const aliases = {
  '@': 'src',
  '@components': 'src/components',
  '@pages': 'src/pages',
  '@lib': 'src/lib',
  '@contexts': 'src/contexts',
  '@providers': 'src/providers',
  '@hooks': 'src/hooks',
  '@utils': 'src/utils',
  '@assets': 'src/assets'
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Function to get all JS/JSX files
function getJSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', 'coverage', '.git'].includes(item)) {
        getJSFiles(fullPath, files);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Function to extract imports from a file
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

// Function to validate if an aliased import can be resolved
function validateImport(importPath, sourceFile) {
  // Check if it's an aliased import (our custom aliases only)
  const isAliasedImport = Object.keys(aliases).some(alias =>
    importPath === alias || importPath.startsWith(alias + '/')
  );

  if (!isAliasedImport) {
    // Not an aliased import, skip validation
    return { valid: true, skip: true };
  }

  // Find which alias matches
  for (const [alias, realPath] of Object.entries(aliases)) {
    if (importPath === alias || importPath.startsWith(alias + '/')) {
      const relativePath = importPath.replace(alias, realPath);
      const absolutePath = path.join(projectRoot, relativePath);

      // Try different extensions
      const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];

      for (const ext of extensions) {
        const fullPath = absolutePath + ext;
        if (fs.existsSync(fullPath)) {
          return { valid: true, resolvedPath: fullPath };
        }
      }

      return {
        valid: false,
        error: `Cannot resolve ${importPath} from ${path.relative(projectRoot, sourceFile)}`
      };
    }
  }

  // Should not reach here
  return { valid: true, skip: true };
}

// Main validation function
function validateAllImports() {
  console.log(`${colors.yellow}🔍 Validating aliased imports...${colors.reset}\n`);

  const srcPath = path.join(projectRoot, 'src');
  const files = getJSFiles(srcPath);

  let errors = [];
  let validated = 0;

  for (const file of files) {
    const imports = extractImports(file);

    for (const importPath of imports) {
      const result = validateImport(importPath, file);

      if (!result.skip) {
        validated++;
        if (!result.valid) {
          errors.push(result.error);
        }
      }
    }
  }

  // Report results
  if (errors.length > 0) {
    console.log(`${colors.red}❌ Found ${errors.length} import resolution errors:${colors.reset}\n`);
    errors.forEach(error => console.log(`  ${colors.red}• ${error}${colors.reset}`));
    console.log();
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ All ${validated} aliased imports resolved successfully!${colors.reset}`);

    // Show summary
    console.log(`\n${colors.green}📦 Alias Summary:${colors.reset}`);
    for (const [alias, realPath] of Object.entries(aliases)) {
      const fullPath = path.join(projectRoot, realPath);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath).length;
        console.log(`  ${colors.green}✓${colors.reset} ${alias} → ${realPath} (${files} items)`);
      } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${alias} → ${realPath} (directory not found)`);
      }
    }
  }
}

// Run validation
try {
  validateAllImports();
} catch (error) {
  console.error(`${colors.red}Error during validation: ${error.message}${colors.reset}`);
  process.exit(1);
}