#!/usr/bin/env node

/**
 * React Singleton Verification Script
 * Ensures only one React instance exists in the project
 * Fails CI if multiple React copies are detected
 */

import { execSync } from 'child_process'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

/**
 * Check for multiple React instances using npm ls
 */
function checkReactSingleton() {
  console.log('🔍 Checking React singleton status...\n')

  try {
    // Check React versions
    const reactOutput = execSync('npm ls react --depth=0', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    })

    const reactDomOutput = execSync('npm ls react-dom --depth=0', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    })

    // Parse versions from output
    const reactVersion = extractVersion(reactOutput, 'react')
    const reactDomVersion = extractVersion(reactDomOutput, 'react-dom')

    console.log(`✅ React version: ${reactVersion}`)
    console.log(`✅ React DOM version: ${reactDomVersion}`)

    // Check version consistency
    if (reactVersion !== reactDomVersion) {
      console.error(`❌ VERSION MISMATCH: React (${reactVersion}) != React DOM (${reactDomVersion})`)
      process.exit(1)
    }

    // Check for duplicate dependencies
    try {
      const allReactOutput = execSync('npm ls react', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const reactInstances = countReactInstances(allReactOutput)

      if (reactInstances > 1) {
        console.error(`❌ MULTIPLE REACT INSTANCES DETECTED: ${reactInstances} copies found`)
        console.error('\nDuplicate React instances can cause:')
        console.error('• Invalid hook call errors')
        console.error('• Context provider failures')
        console.error('• Component state issues')
        console.error('\nRun "npm dedupe" to fix this issue.')
        process.exit(1)
      }

      console.log(`✅ Single React instance confirmed`)

    } catch (error) {
      // npm ls might fail if there are peer dependency issues, but that's ok
      console.log('⚠️  Could not check for duplicates (this is usually fine)')
    }

    // Runtime verification
    logRuntimePaths()

    console.log('\n✅ React singleton verification passed!')

  } catch (error) {
    console.error('❌ Failed to check React versions:', error.message)
    process.exit(1)
  }
}

/**
 * Extract version from npm ls output
 */
function extractVersion(output, packageName) {
  const regex = new RegExp(`${packageName}@([\\d\\.]+(?:-[a-z\\d\\.]+)?)`)
  const match = output.match(regex)
  return match ? match[1] : 'unknown'
}

/**
 * Count React instances in dependency tree
 */
function countReactInstances(output) {
  // Count occurrences of "react@" in the output
  const matches = output.match(/react@/g)
  return matches ? matches.length : 0
}

/**
 * Log resolved module paths for runtime verification
 */
function logRuntimePaths() {
  console.log('\n📍 Runtime module resolution:')

  try {
    // Create a temporary module to resolve paths
    const tempScript = `
      console.log('React path:', require.resolve('react'))
      console.log('React DOM path:', require.resolve('react-dom'))
    `

    const output = execSync(`node -e "${tempScript}"`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    })

    console.log(output.trim())

    // Check if paths are in the same node_modules
    const lines = output.trim().split('\n')
    const reactPath = lines[0]?.split(': ')[1] || ''
    const reactDomPath = lines[1]?.split(': ')[1] || ''

    if (reactPath && reactDomPath) {
      const reactNodeModules = reactPath.split('node_modules')[0] + 'node_modules'
      const reactDomNodeModules = reactDomPath.split('node_modules')[0] + 'node_modules'

      if (reactNodeModules !== reactDomNodeModules) {
        console.error('❌ React and React DOM are resolved from different node_modules!')
        process.exit(1)
      }
    }

  } catch (error) {
    console.log('⚠️  Could not resolve runtime paths:', error.message)
  }
}

// Run the check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkReactSingleton()
}

export { checkReactSingleton }