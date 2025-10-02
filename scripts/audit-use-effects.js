#!/usr/bin/env node
/**
 * useEffect Dependency Audit Script
 * Scans all React components for potentially problematic useEffect patterns
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

const issues = []
const RISKY_PATTERNS = {
  fetchInEffect: /useEffect\([^)]*fetch[^)]*\)/,
  navigateInEffect: /useEffect\([^)]*navigate\([^)]*\)/,
  setStateInEffect: /useEffect\([^)]*set[A-Z][a-zA-Z]*\([^)]*\)/,
  emptyDeps: /useEffect\([^)]*,\s*\[\s*\]\)/,
  noDeps: /useEffect\([^)]*\)\s*$/,
  missingSetter: /useEffect\([^{]*\{[^}]*set[A-Z][a-zA-Z]*\([^}]*\},\s*\[[^\]]*\]\)/
}

async function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    if (line.includes('useEffect')) {
      // Check for risky patterns
      for (const [pattern, regex] of Object.entries(RISKY_PATTERNS)) {
        if (regex.test(content.slice(content.indexOf(line)))) {
          issues.push({
            file: filePath.replace(process.cwd(), ''),
            line: index + 1,
            pattern,
            code: line.trim()
          })
        }
      }
    }
  })
}

async function main() {
  console.log('🔍 Auditing useEffect hooks...\n')

  const files = await glob('src/**/*.{jsx,js}', {
    ignore: ['**/*.test.{jsx,js}', '**/*.stories.{jsx,js}', '**/node_modules/**']
  })

  for (const file of files) {
    await auditFile(file)
  }

  console.log(`Found ${issues.length} potential issues:\n`)

  // Group by pattern
  const grouped = {}
  issues.forEach(issue => {
    if (!grouped[issue.pattern]) grouped[issue.pattern] = []
    grouped[issue.pattern].push(issue)
  })

  for (const [pattern, items] of Object.entries(grouped)) {
    console.log(`\n${pattern} (${items.length} occurrences):`)
    items.slice(0, 5).forEach(item => {
      console.log(`  ${item.file}:${item.line}`)
    })
    if (items.length > 5) {
      console.log(`  ... and ${items.length - 5} more`)
    }
  }
}

main().catch(console.error)
