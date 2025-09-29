#!/usr/bin/env node

/**
 * Dev Server Guardrail Script
 * Pre-flight checks to prevent dev server failures
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

const projectRoot = process.cwd()

function checkCriticalIssues() {
  console.log('🛡️  Running dev server guardrail checks...\n')

  let issues = []
  let fixes = []

  // 1. Check if .bin directory exists
  const binDir = resolve(projectRoot, 'node_modules/.bin')
  if (!existsSync(binDir)) {
    issues.push('❌ Missing node_modules/.bin directory (WSL symlink issue)')
    fixes.push('mkdir -p node_modules/.bin')
    fixes.push('ln -sf ../vite/bin/vite.js node_modules/.bin/vite')
  }

  // 2. Check if vite binary is accessible
  const viteBin = resolve(projectRoot, 'node_modules/.bin/vite')
  if (!existsSync(viteBin)) {
    issues.push('❌ Vite binary missing or not linked')
    fixes.push('ln -sf ../vite/bin/vite.js node_modules/.bin/vite')
  }

  // 3. Check for Rollup native module
  try {
    execSync('node -e "require(\'rollup\')"', { stdio: 'pipe' })
    console.log('✅ Rollup native module working')
  } catch (error) {
    if (error.message.includes('rollup-linux-x64-gnu')) {
      issues.push('❌ Rollup missing optional dependency (npm bug)')
      fixes.push('npm install --omit=optional')
      fixes.push('OR: rm -rf node_modules package-lock.json && npm install')
    }
  }

  // 4. Check critical files
  const criticalFiles = ['src/main.jsx', 'index.html', 'vite.config.js']
  for (const file of criticalFiles) {
    if (!existsSync(file)) {
      issues.push(`❌ Missing critical file: ${file}`)
    } else {
      console.log(`✅ ${file} exists`)
    }
  }

  // 5. Check React instances (warning only)
  try {
    const reactOutput = execSync('npm ls react', { encoding: 'utf8', stdio: 'pipe' })
    const reactCount = (reactOutput.match(/react@/g) || []).length
    if (reactCount > 10) {
      console.log(`⚠️  Multiple React instances detected (${reactCount}) - Vite config should handle runtime singleton`)
    } else {
      console.log('✅ React instances within normal range')
    }
  } catch (error) {
    console.log('⚠️  Could not check React instances (this is usually fine)')
  }

  // Print results
  if (issues.length > 0) {
    console.log('\n🚨 Issues detected:')
    issues.forEach(issue => console.log(`  ${issue}`))

    console.log('\n🔧 Suggested fixes:')
    fixes.forEach(fix => console.log(`  ${fix}`))

    process.exit(1)
  } else {
    console.log('\n🎉 All guardrail checks passed!')
    console.log('Dev server should start successfully.')
  }
}

// Run checks
if (import.meta.url === `file://${process.argv[1]}`) {
  checkCriticalIssues()
}

export { checkCriticalIssues }