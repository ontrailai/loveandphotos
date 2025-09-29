/**
 * Contract Testing Helpers
 * Utilities for setting up test data and mocking contract-related functionality
 */

// Mock booking flow data generators
export function createValidBookingFlow(overrides = {}) {
  return {
    photographerId: 'test-photographer',
    currentStep: 'contract',
    completedSteps: ['schedule', 'package', 'location', 'addons'],
    scheduleDetails: {
      date: '2024-06-15',
      timeOfDay: 'morning',
      selectedAt: '2024-01-15T10:00:00.000Z'
    },
    packageDetails: {
      packageType: 'monthly',
      packagePrice: 500,
      packageTitle: 'Wedding Package',
      hoursBooked: 4,
      isPhotoVideo: false,
      selectedAt: '2024-01-15T10:05:00.000Z'
    },
    locationDetails: {
      locationId: 'loc1',
      locationTitle: 'Central Park',
      locationVibe: 'romantic',
      selectedAt: '2024-01-15T10:10:00.000Z'
    },
    addonsDetails: {
      selectedAddons: [],
      totalAddonsPrice: 0,
      selectedAt: '2024-01-15T10:15:00.000Z'
    },
    contractDetails: {
      contractSigned: false,
      contractSignatureId: null,
      contractVersion: null,
      signedAt: null
    },
    validationState: {
      schedule: true,
      package: true,
      location: true,
      addons: true,
      contract: false
    },
    ...overrides
  }
}

export function createIncompleteBookingFlow(missingSteps = ['schedule']) {
  const baseFlow = createValidBookingFlow()

  if (missingSteps.includes('schedule')) {
    baseFlow.scheduleDetails = { date: null, timeOfDay: null, selectedAt: null }
    baseFlow.validationState.schedule = false
  }

  if (missingSteps.includes('package')) {
    baseFlow.packageDetails = {
      packageType: null,
      packagePrice: null,
      packageTitle: null,
      selectedAt: null
    }
    baseFlow.validationState.package = false
  }

  if (missingSteps.includes('location')) {
    baseFlow.locationDetails = {
      locationId: null,
      locationTitle: null,
      locationVibe: null,
      selectedAt: null
    }
    baseFlow.validationState.location = false
  }

  // Update completed steps based on what's missing
  baseFlow.completedSteps = baseFlow.completedSteps.filter(step => !missingSteps.includes(step))

  return baseFlow
}

export function createMockContractData(overrides = {}) {
  return {
    contractText: 'THIS IS A LEGAL CONTRACT\n\nEvent Date: June 15, 2024\nLocation: Central Park\nPackage: Wedding Package\nPrice: $500\n\nTerms and conditions apply...',
    contractHash: 'contract-hash-123',
    contractVersion: 'LNP-Contract-v1.0',
    bookingData: {
      eventDate: 'June 15, 2024',
      location: 'Central Park',
      packageName: 'Wedding Package',
      price: '$500'
    },
    ...overrides
  }
}

export function createMockSignatureData(overrides = {}) {
  return {
    signaturePngBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    signerFullName: 'John Doe',
    consentAccepted: true,
    ...overrides
  }
}

// Console monitoring utilities
export class ConsoleMonitor {
  constructor() {
    this.messages = []
    this.originalConsole = {}
    this.isMonitoring = false
  }

  startMonitoring() {
    if (this.isMonitoring) return

    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    }

    const monitor = this

    console.log = (...args) => {
      monitor.messages.push({ type: 'log', message: args.join(' '), timestamp: Date.now() })
      monitor.originalConsole.log(...args)
    }

    console.warn = (...args) => {
      monitor.messages.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() })
      monitor.originalConsole.warn(...args)
    }

    console.error = (...args) => {
      monitor.messages.push({ type: 'error', message: args.join(' '), timestamp: Date.now() })
      monitor.originalConsole.error(...args)
    }

    console.info = (...args) => {
      monitor.messages.push({ type: 'info', message: args.join(' '), timestamp: Date.now() })
      monitor.originalConsole.info(...args)
    }

    this.isMonitoring = true
  }

  stopMonitoring() {
    if (!this.isMonitoring) return

    console.log = this.originalConsole.log
    console.warn = this.originalConsole.warn
    console.error = this.originalConsole.error
    console.info = this.originalConsole.info

    this.isMonitoring = false
  }

  getMessages() {
    return [...this.messages]
  }

  getWarnings() {
    return this.messages.filter(msg => msg.type === 'warn')
  }

  getErrors() {
    return this.messages.filter(msg => msg.type === 'error')
  }

  getDuplicateKeyWarnings() {
    return this.messages.filter(msg =>
      msg.message.includes('Warning: Encountered two children with the same key') ||
      msg.message.includes('Each child in a list should have a unique "key" prop') ||
      msg.message.toLowerCase().includes('duplicate key')
    )
  }

  clear() {
    this.messages = []
  }

  assertNoReactWarnings() {
    const warnings = this.getDuplicateKeyWarnings()
    if (warnings.length > 0) {
      throw new Error(`Found React duplicate key warnings: ${warnings.map(w => w.message).join(', ')}`)
    }
  }

  assertNoUnexpectedErrors() {
    const errors = this.getErrors().filter(error =>
      !error.message.includes('404') && // Expected 404s
      !error.message.includes('Network Error') && // Expected network errors
      !error.message.includes('AbortError') // Expected abort errors
    )

    if (errors.length > 0) {
      throw new Error(`Found unexpected errors: ${errors.map(e => e.message).join(', ')}`)
    }
  }
}

// Network request monitoring
export class NetworkMonitor {
  constructor() {
    this.requests = []
    this.responses = []
  }

  trackRequest(url, method = 'GET', timestamp = Date.now()) {
    this.requests.push({ url, method, timestamp })
  }

  trackResponse(url, status, timestamp = Date.now()) {
    this.responses.push({ url, status, timestamp })
  }

  getContractRequests() {
    return this.requests.filter(req => req.url.includes('/api/contracts'))
  }

  getFailedRequests() {
    return this.responses.filter(res => res.status >= 400)
  }

  getRequestCount(urlPattern) {
    const regex = new RegExp(urlPattern)
    return this.requests.filter(req => regex.test(req.url)).length
  }

  clear() {
    this.requests = []
    this.responses = []
  }

  assertMaxRetries(urlPattern, maxRetries = 3) {
    const count = this.getRequestCount(urlPattern)
    if (count > maxRetries) {
      throw new Error(`Too many requests to ${urlPattern}: ${count} (max: ${maxRetries})`)
    }
  }
}

// Mock API responses
export function createMockFetch(responses = {}) {
  return jest.fn((url, options = {}) => {
    const method = options.method || 'GET'
    const key = `${method} ${url}`

    if (responses[key]) {
      const response = responses[key]
      return Promise.resolve({
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText || 'OK',
        json: () => Promise.resolve(response.body),
        text: () => Promise.resolve(JSON.stringify(response.body))
      })
    }

    // Default 404 response
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'Not Found' })
    })
  })
}

// Signature validation test helpers
export function createValidSignature() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
}

export function createInvalidSignature() {
  return 'not-a-base64-signature'
}

export function createOversizedSignature() {
  // Create a signature larger than 2MB
  const largeData = 'A'.repeat(3 * 1024 * 1024) // 3MB of data
  return `data:image/png;base64,${largeData}`
}

// Timeout utilities
export function createTimeoutPromise(ms, rejectValue = new Error('Timeout')) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(rejectValue), ms)
  })
}

export function withTimeout(promise, ms, timeoutError = new Error('Operation timed out')) {
  return Promise.race([
    promise,
    createTimeoutPromise(ms, timeoutError)
  ])
}

// Test environment setup helpers
export function setupContractTestEnvironment() {
  // Mock window.location for navigation tests
  delete window.location
  window.location = {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: jest.fn(),
    replace: jest.fn(),
    assign: jest.fn()
  }

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

  return {
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock
  }
}

// Canvas signature simulation for E2E tests
export async function drawSignatureOnCanvas(page, canvasSelector = '#signature canvas') {
  const canvas = page.locator(canvasSelector)
  await expect(canvas).toBeVisible()

  const box = await canvas.boundingBox()

  // Draw a simple signature path
  await page.mouse.move(box.x + 50, box.y + 50)
  await page.mouse.down()
  await page.mouse.move(box.x + 150, box.y + 80)
  await page.mouse.move(box.x + 100, box.y + 120)
  await page.mouse.move(box.x + 180, box.y + 100)
  await page.mouse.up()
}

export async function clearSignature(page, clearButtonSelector = 'button:has-text("Clear")') {
  await page.click(clearButtonSelector)
}

// Validation error expectations
export const VALIDATION_ERRORS = {
  SIGNATURE_REQUIRED: 'Signature is required',
  CONSENT_REQUIRED: 'You must agree to the terms and conditions',
  SIGNATURE_TOO_LARGE: 'Signature image is too large (max 2MB)',
  INVALID_FORMAT: 'Invalid signature format',
  SIGNER_NAME_TOO_LONG: 'Signer name is too long (max 100 characters)'
}

// Contract content expectations
export const CONTRACT_CONTENT = {
  HEADER: 'THIS IS A LEGAL CONTRACT',
  VERSION_PREFIX: 'LNP-Contract-v',
  REQUIRED_FIELDS: ['Event Date:', 'Location:', 'Package:', 'Price:']
}

// Timing constants for tests
export const TIMEOUTS = {
  CONTRACT_LOAD: 10000,
  SIGNATURE_SUBMIT: 5000,
  NAVIGATION: 3000,
  NETWORK_ERROR: 2000,
  ANIMATION: 1000
}