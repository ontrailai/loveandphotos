#!/usr/bin/env node

/**
 * Footer Verification Script
 * Checks that the unified footer is properly imported and used across all layouts
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying footer implementation across the project...\n');

const layoutFiles = [
  'src/components/Layout.jsx',
  'src/components/PublicLayout.jsx',
  'src/components/ClientLayout.jsx',
  'src/components/TalentLayout.jsx',
  'src/components/AdminLayout.jsx'
];

const pagesUsingFooter = [
  'src/pages/Home.jsx',
  'src/pages/Demo.jsx'
];

let allChecksPass = true;

// Check layouts for footer import and usage
console.log('📂 Checking layout files:');
layoutFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ ${file} - File not found`);
    allChecksPass = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasImport = content.includes("import { Footer } from './ui/footer-section'") || 
                    content.includes('import { Footer } from "../components/ui/footer-section');
  const hasUsage = content.includes('<Footer />') || content.includes('<Footer/>');
  
  if (hasImport && hasUsage) {
    console.log(`  ✅ ${file} - Footer properly integrated`);
  } else if (hasImport && !hasUsage) {
    console.log(`  ⚠️  ${file} - Footer imported but not used`);
    allChecksPass = false;
  } else if (!hasImport && hasUsage) {
    console.log(`  ❌ ${file} - Footer used but not imported`);
    allChecksPass = false;
  } else {
    console.log(`  ℹ️  ${file} - No footer (may be intentional)`);
  }
});

// Check pages directly using footer
console.log('\n📄 Checking pages with direct footer usage:');
pagesUsingFooter.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ ${file} - File not found`);
    allChecksPass = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasImport = content.includes("import { Footer } from '../components/ui/footer-section'") ||
                    content.includes("import { Footer } from './ui/footer-section'");
  const hasUsage = content.includes('<Footer />') || content.includes('<Footer/>');
  
  if (hasImport && hasUsage) {
    console.log(`  ✅ ${file} - Footer properly integrated`);
  } else {
    console.log(`  ⚠️  ${file} - Footer may need attention`);
  }
});

// Check for old footer references
console.log('\n🔍 Checking for deprecated footer references:');
const srcDir = path.join(process.cwd(), 'src');
const checkForOldFooter = (dir) => {
  const files = fs.readdirSync(dir);
  let foundOld = false;
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      checkForOldFooter(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes("from '@components/Footer'") || 
          content.includes('from "./Footer"') ||
          content.includes('from "../Footer"')) {
        console.log(`  ⚠️  ${fullPath.replace(process.cwd(), '')} - Contains old footer import`);
        foundOld = true;
        allChecksPass = false;
      }
    }
  });
  
  return foundOld;
};

const hasOldRefs = checkForOldFooter(srcDir);
if (!hasOldRefs) {
  console.log('  ✅ No references to old Footer component found');
}

// Check unified footer exists
console.log('\n📦 Checking unified footer:');
const unifiedFooterPath = path.join(process.cwd(), 'src/components/ui/footer-section.jsx');
if (fs.existsSync(unifiedFooterPath)) {
  const content = fs.readFileSync(unifiedFooterPath, 'utf8');
  const hasReactRouter = content.includes('react-router-dom');
  const hasAccessibility = content.includes('aria-label');
  const hasAnimation = content.includes('motion');
  
  console.log(`  ✅ Unified footer exists at: src/components/ui/footer-section.jsx`);
  console.log(`  ${hasReactRouter ? '✅' : '❌'} Uses React Router for navigation`);
  console.log(`  ${hasAccessibility ? '✅' : '❌'} Has accessibility attributes`);
  console.log(`  ${hasAnimation ? '✅' : '❌'} Includes animation support`);
} else {
  console.log('  ❌ Unified footer not found!');
  allChecksPass = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allChecksPass) {
  console.log('✅ Footer consolidation successful! All checks passed.');
} else {
  console.log('⚠️  Some issues were found. Please review the output above.');
}

console.log('\n📝 Recommendations:');
console.log('  1. Test the footer on mobile devices');
console.log('  2. Verify dark mode compatibility');
console.log('  3. Check all links are working');
console.log('  4. Test keyboard navigation');
console.log('  5. Validate with screen readers');

process.exit(allChecksPass ? 0 : 1);