#!/usr/bin/env node
/**
 * Contract Signing System Validation Script
 * Tests the robust timeout/retry utilities and contract signing endpoint
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test configuration
const API_BASE = 'http://localhost:3001'
const TEST_TIMEOUT = 30000

// Sample test data
const validSignatureRequest = {
  bookingId: 'test-booking-123',
  contractVersion: '1.0',
  contractHash: 'testhash123456',
  eventDate: '2024-06-15',
  location: 'Test Wedding Venue',
  packageName: 'Premium Photography Package',
  price: 299.99,
  signerFullName: 'Test User',
  signaturePngBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  signedAtISO: new Date().toISOString(),
  userId: 'test-user-123'
}

// Test utilities
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const emoji = { info: '📋', success: '✅', error: '❌', warning: '⚠️' }[type] || '📋'
  console.log(`${emoji} [${timestamp}] ${message}`)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const requestOptions = {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  log(`Making ${options.method || 'GET'} request to ${endpoint}`)

  try {
    const response = await fetch(url, requestOptions)
    const data = await response.json()

    return {
      status: response.status,
      data,
      ok: response.ok
    }
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error')
    throw error
  }
}

// Test cases
async function testHealthCheck() {
  log('Testing health check endpoint...')

  const response = await makeRequest('/api/health')

  if (response.ok) {
    log('Health check passed', 'success')
    log(`Contract service status: ${response.data.services?.contractSigning || 'unknown'}`)
    return true
  } else {
    log('Health check failed', 'error')
    return false
  }
}

async function testValidContractSigning() {
  log('Testing valid contract signing...')

  const response = await makeRequest('/api/contract/sign', {
    method: 'POST',
    body: JSON.stringify(validSignatureRequest)
  })

  if (response.ok && response.data.success) {
    log(`Contract signed successfully: ${response.data.contractSignatureId}`, 'success')
    log(`Processing time: ${response.data.processingTime}ms`)
    return response.data.contractSignatureId
  } else {
    log(`Contract signing failed: ${response.data.error || 'Unknown error'}`, 'error')
    return null
  }
}

async function testInvalidSignatureFormat() {
  log('Testing invalid signature format validation...')

  const invalidRequest = {
    ...validSignatureRequest,
    signaturePngBase64: 'data:image/jpeg;base64,invalid'
  }

  const response = await makeRequest('/api/contract/sign', {
    method: 'POST',
    body: JSON.stringify(invalidRequest)
  })

  if (response.status === 400 && response.data.code === 'INVALID_SIGNATURE_FORMAT') {
    log('Invalid format validation passed', 'success')
    return true
  } else {
    log('Invalid format validation failed', 'error')
    return false
  }
}

async function testMissingFields() {
  log('Testing missing required fields validation...')

  const invalidRequest = {
    bookingId: validSignatureRequest.bookingId
    // Missing other required fields
  }

  const response = await makeRequest('/api/contract/sign', {
    method: 'POST',
    body: JSON.stringify(invalidRequest)
  })

  if (response.status === 400 && response.data.code === 'MISSING_REQUIRED_FIELDS') {
    log('Missing fields validation passed', 'success')
    log(`Missing fields: ${response.data.missing?.join(', ') || 'unknown'}`)
    return true
  } else {
    log('Missing fields validation failed', 'error')
    return false
  }
}

async function testRateLimiting() {
  log('Testing rate limiting (5 requests per minute)...')

  const requests = []
  for (let i = 0; i < 6; i++) {
    const request = {
      ...validSignatureRequest,
      bookingId: `test-booking-rate-limit-${i}`
    }

    requests.push(
      makeRequest('/api/contract/sign', {
        method: 'POST',
        body: JSON.stringify(request)
      }).catch(err => ({ error: err.message }))
    )
  }

  const responses = await Promise.all(requests)
  const rateLimited = responses.filter(r => r.status === 429)

  if (rateLimited.length > 0) {
    log(`Rate limiting working: ${rateLimited.length} requests blocked`, 'success')
    log(`Retry after: ${rateLimited[0].data?.retryAfter || 'unknown'} seconds`)
    return true
  } else {
    log('Rate limiting may not be working as expected', 'warning')
    return false
  }
}

async function testContractStatus(signatureId) {
  if (!signatureId) {
    log('Skipping status test - no signature ID available', 'warning')
    return false
  }

  log(`Testing contract status retrieval for ${signatureId}...`)

  const response = await makeRequest(`/api/contract/status/${signatureId}`)

  if (response.ok && response.data.success) {
    log('Contract status retrieval passed', 'success')
    log(`Signer: ${response.data.signature?.signer_full_name || 'unknown'}`)
    log(`Event date: ${response.data.signature?.event_date || 'unknown'}`)
    return true
  } else {
    log('Contract status retrieval failed', 'error')
    return false
  }
}

async function testLargeSignature() {
  log('Testing large signature rejection (>2MB)...')

  // Create a large base64 string (>2MB)
  const largeSignature = 'data:image/png;base64,' + 'A'.repeat(3 * 1024 * 1024)

  const invalidRequest = {
    ...validSignatureRequest,
    signaturePngBase64: largeSignature
  }

  const response = await makeRequest('/api/contract/sign', {
    method: 'POST',
    body: JSON.stringify(invalidRequest)
  })

  if (response.status === 400 && response.data.code === 'SIGNATURE_TOO_LARGE') {
    log('Large signature validation passed', 'success')
    log(`Actual size reported: ${response.data.actualSize || 'unknown'}`)
    return true
  } else {
    log('Large signature validation failed', 'error')
    return false
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Contract Signing System Validation')
  log(`API Base URL: ${API_BASE}`)

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  }

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Valid Contract Signing', fn: testValidContractSigning },
    { name: 'Invalid Signature Format', fn: testInvalidSignatureFormat },
    { name: 'Missing Required Fields', fn: testMissingFields },
    { name: 'Large Signature Rejection', fn: testLargeSignature },
    { name: 'Rate Limiting', fn: testRateLimiting }
  ]

  let signatureId = null

  for (const test of tests) {
    results.total++

    try {
      log(`\n--- Running Test: ${test.name} ---`)

      const result = await test.fn(signatureId)

      if (test.name === 'Valid Contract Signing' && result) {
        signatureId = result
      }

      if (result) {
        results.passed++
        log(`Test "${test.name}" PASSED`, 'success')
      } else {
        results.failed++
        log(`Test "${test.name}" FAILED`, 'error')
      }
    } catch (error) {
      results.failed++
      log(`Test "${test.name}" ERROR: ${error.message}`, 'error')
    }

    // Small delay between tests
    await sleep(100)
  }

  // Test contract status with the signature ID from successful signing
  if (signatureId) {
    results.total++
    try {
      log(`\n--- Running Test: Contract Status Retrieval ---`)
      const statusResult = await testContractStatus(signatureId)

      if (statusResult) {
        results.passed++
        log('Test "Contract Status Retrieval" PASSED', 'success')
      } else {
        results.failed++
        log('Test "Contract Status Retrieval" FAILED', 'error')
      }
    } catch (error) {
      results.failed++
      log(`Test "Contract Status Retrieval" ERROR: ${error.message}`, 'error')
    }
  }

  // Summary
  log(`\n📊 Test Results Summary:`)
  log(`Total tests: ${results.total}`)
  log(`Passed: ${results.passed}`, 'success')
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info')
  log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`)

  if (results.failed === 0) {
    log('\n🎉 All tests passed! Contract signing system is working correctly.', 'success')
    process.exit(0)
  } else {
    log(`\n💥 ${results.failed} test(s) failed. Please check the implementation.`, 'error')
    process.exit(1)
  }
}

// Check if server is running before starting tests
async function checkServerRunning() {
  try {
    await makeRequest('/api/health')
    return true
  } catch (error) {
    return false
  }
}

// Entry point
async function main() {
  // Check if server is running
  log('Checking if API server is running...')

  const serverRunning = await checkServerRunning()

  if (!serverRunning) {
    log('❌ API server not running at http://localhost:3001', 'error')
    log('Please start the server with: npm run dev:api', 'info')
    process.exit(1)
  }

  log('✅ API server is running', 'success')

  // Run tests
  await runTests()
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error')
  process.exit(1)
})

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  log('\n👋 Test execution interrupted by user', 'warning')
  process.exit(0)
})

// Set timeout for entire test suite
setTimeout(() => {
  log('Test suite timed out after 30 seconds', 'error')
  process.exit(1)
}, TEST_TIMEOUT)

// Run the tests
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error')
  process.exit(1)
})