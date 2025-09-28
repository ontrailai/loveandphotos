#!/usr/bin/env node

/**
 * Large Query Detection Script
 * Scans for potentially oversized Supabase .in() queries that could cause net::ERR_FAILED
 * Integrates with CI to prevent regression of URL length issues
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

// Configuration
const MAX_ARRAY_SIZE = 50
const SUSPICIOUS_PATTERNS = [
  /userIds|photographerIds|itemIds|allIds/i,
  /users\.map|photographers\.map|items\.map/i,
  /Array\.from.*length/i,
  /\.length\s*>\s*\d{2,}/i  // Arrays with length > 10+
]

const SUPABASE_IN_PATTERNS = [
  /\.in\s*\(\s*['"`][^'"`]+['"`]\s*,\s*([^)]+)\)/g,  // .in('column', array)
  /\.in\s*\(\s*"[^"]+"\s*,\s*([^)]+)\)/g,            // .in("column", array)
  /\.in\s*\(\s*'[^']+'\s*,\s*([^)]+)\)/g             // .in('column', array)
]

class LargeQueryDetector {
  constructor() {
    this.issues = []
    this.scannedFiles = 0
    this.hasSupabaseImports = new Set()
  }

  /**
   * Scan a single file for large query patterns
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      this.scannedFiles++

      // Check for Supabase and batching imports
      const hasBatchingImport = this.checkImports(content, filePath)

      // Find .in() queries
      const queries = this.findSupabaseInQueries(content, filePath)

      // Analyze each query for potential size issues
      queries.forEach(query => {
        this.analyzeQuery(query, filePath, hasBatchingImport)
      })

    } catch (error) {
      this.addIssue({
        file: filePath,
        type: 'scan_error',
        message: `Failed to scan file: ${error.message}`,
        severity: 'error'
      })
    }
  }

  /**
   * Check for relevant imports in the file
   */
  checkImports(content, filePath) {
    const hasSupabase = /from\s+['"]@supabase\/supabase-js['"]|supabaseClient|\.from\(/.test(content)
    const hasBatching = /from\s+['"]@utils\/batchSupabaseQueries['"]|fetchInBatches/.test(content)

    if (hasSupabase) {
      this.hasSupabaseImports.add(filePath)
    }

    return hasBatching
  }

  /**
   * Find all Supabase .in() queries in content
   */
  findSupabaseInQueries(content, filePath) {
    const queries = []
    const lines = content.split('\n')

    lines.forEach((line, lineNumber) => {
      SUPABASE_IN_PATTERNS.forEach(pattern => {
        let match
        while ((match = pattern.exec(line)) !== null) {
          queries.push({
            file: filePath,
            line: lineNumber + 1,
            text: line.trim(),
            arrayArg: match[1],
            fullMatch: match[0]
          })
        }
      })
    })

    return queries
  }

  /**
   * Analyze a specific query for potential issues
   */
  analyzeQuery(query, filePath, hasBatchingImport) {
    const { arrayArg, line, text } = query

    // Case 1: Literal array with many elements
    const literalArrayMatch = arrayArg.match(/\[([^\]]+)\]/)
    if (literalArrayMatch) {
      const elements = literalArrayMatch[1].split(',').filter(el => el.trim())
      if (elements.length > MAX_ARRAY_SIZE) {
        this.addIssue({
          file: filePath,
          line,
          type: 'large_literal_array',
          severity: 'error',
          message: `Large literal array in .in() query (${elements.length} items). Use fetchInBatches for arrays > ${MAX_ARRAY_SIZE} items.`,
          suggestion: 'Replace with: await fetchInBatches(client, table, fields, column, array, { batchSize: 50 })',
          code: text
        })
        return
      }
    }

    // Case 2: Suspicious variable names
    const isSuspiciousVariable = SUSPICIOUS_PATTERNS.some(pattern =>
      pattern.test(arrayArg)
    )

    if (isSuspiciousVariable) {
      this.addIssue({
        file: filePath,
        line,
        type: 'suspicious_array_variable',
        severity: 'warning',
        message: `Potentially large array variable "${arrayArg}" in .in() query. Consider using fetchInBatches if array size > ${MAX_ARRAY_SIZE}.`,
        suggestion: 'If array can be large, use fetchInBatches instead of direct .in() query',
        code: text
      })
    }

    // Case 3: Dynamic arrays (function calls, complex expressions)
    if (/\(|\.|map\(|filter\(|Array\./.test(arrayArg)) {
      this.addIssue({
        file: filePath,
        line,
        type: 'dynamic_array',
        severity: 'info',
        message: `Dynamic array expression in .in() query. Ensure array size is validated.`,
        suggestion: 'Consider using fetchInBatches if the array size is not guaranteed to be small',
        code: text
      })
    }

    // Case 4: Missing batching import
    if (!hasBatchingImport && this.hasSupabaseImports.has(filePath)) {
      this.addIssue({
        file: filePath,
        line: 1,
        type: 'missing_batching_import',
        severity: 'info',
        message: 'File contains Supabase queries but does not import fetchInBatches utility.',
        suggestion: 'Add: import { fetchInBatches } from "@utils/batchSupabaseQueries"',
        code: ''
      })
    }
  }

  /**
   * Add an issue to the results
   */
  addIssue(issue) {
    this.issues.push({
      ...issue,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get scan results summary
   */
  getSummary() {
    const errorCount = this.issues.filter(i => i.severity === 'error').length
    const warningCount = this.issues.filter(i => i.severity === 'warning').length
    const infoCount = this.issues.filter(i => i.severity === 'info').length

    return {
      scannedFiles: this.scannedFiles,
      totalIssues: this.issues.length,
      errors: errorCount,
      warnings: warningCount,
      info: infoCount,
      hasCriticalIssues: errorCount > 0
    }
  }

  /**
   * Format results for console output
   */
  formatResults() {
    const summary = this.getSummary()
    let output = []

    // Header
    output.push('🔍 Large Supabase Query Detection Results')
    output.push('==========================================')
    output.push('')
    output.push(`📁 Files scanned: ${summary.scannedFiles}`)
    output.push(`⚠️  Total issues: ${summary.totalIssues}`)
    output.push(`❌ Errors: ${summary.errors}`)
    output.push(`⚠️  Warnings: ${summary.warnings}`)
    output.push(`ℹ️  Info: ${summary.info}`)
    output.push('')

    if (this.issues.length === 0) {
      output.push('✅ No large query issues detected!')
      return output.join('\n')
    }

    // Group issues by file
    const issuesByFile = this.issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = []
      acc[issue.file].push(issue)
      return acc
    }, {})

    // Display issues
    Object.entries(issuesByFile).forEach(([file, issues]) => {
      output.push(`📄 ${file}`)
      output.push('-'.repeat(file.length + 3))

      issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'
        output.push(`  ${icon} Line ${issue.line}: ${issue.message}`)
        if (issue.code) {
          output.push(`     Code: ${issue.code}`)
        }
        if (issue.suggestion) {
          output.push(`     💡 ${issue.suggestion}`)
        }
        output.push('')
      })
    })

    // Footer with recommendations
    if (summary.hasCriticalIssues) {
      output.push('🚨 Critical Issues Detected')
      output.push('Please fix error-level issues to prevent URL length errors in production.')
      output.push('')
      output.push('📚 Quick Fix Guide:')
      output.push('1. Replace large .in() queries with fetchInBatches utility')
      output.push('2. Import: import { fetchInBatches } from "@utils/batchSupabaseQueries"')
      output.push('3. Usage: await fetchInBatches(client, table, fields, column, largeArray, { batchSize: 50 })')
    }

    return output.join('\n')
  }

  /**
   * Save results to JSON file for CI integration
   */
  saveResults(outputPath) {
    const results = {
      summary: this.getSummary(),
      issues: this.issues,
      scanTimestamp: new Date().toISOString()
    }

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  }
}

/**
 * Main execution
 */
function main() {
  const detector = new LargeQueryDetector()

  // Default scan patterns
  const scanPatterns = [
    'src/**/*.js',
    'src/**/*.jsx',
    'api/**/*.js'
  ]

  console.log('🔍 Scanning for large Supabase queries...')
  console.log('')

  // Scan all matching files
  scanPatterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/dist/**'] })
    files.forEach(file => {
      detector.scanFile(file)
    })
  })

  // Output results
  const results = detector.formatResults()
  console.log(results)

  // Save JSON results for CI integration
  const outputPath = path.join(process.cwd(), 'large-query-scan-results.json')
  detector.saveResults(outputPath)
  console.log(`\n📊 Detailed results saved to: ${outputPath}`)

  // Exit with appropriate code for CI
  const summary = detector.getSummary()
  if (summary.hasCriticalIssues) {
    console.log('\n❌ Scan failed due to critical issues.')
    process.exit(1)
  } else if (summary.warnings > 0) {
    console.log('\n⚠️  Scan completed with warnings.')
    process.exit(0)
  } else {
    console.log('\n✅ Scan completed successfully.')
    process.exit(0)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default LargeQueryDetector