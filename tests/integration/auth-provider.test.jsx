/**
 * Integration Tests for Auth Provider and Supabase Client
 * Tests that AuthProvider is mounted once and no duplicate Supabase clients exist
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'
import '@testing-library/jest-dom'

// Track console warnings
let consoleWarnSpy
let consoleErrorSpy
const warnings = []
const errors = []

// Mock Supabase to detect multiple client instantiation
let supabaseClientCount = 0
const originalCreateClient = jest.requireActual('@supabase/supabase-js').createClient

jest.mock('@supabase/supabase-js', () => ({
  ...jest.requireActual('@supabase/supabase-js'),
  createClient: jest.fn((url, key, options) => {
    supabaseClientCount++

    // Track if multiple instances are created with different storage keys
    if (window.__supabaseInstances) {
      window.__supabaseInstances.push({ url, key, storageKey: options?.auth?.storageKey })
    } else {
      window.__supabaseInstances = [{ url, key, storageKey: options?.auth?.storageKey }]
    }

    // Return mock client
    return {
      auth: {
        signUp: jest.fn(),
        signIn: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: jest.fn((callback) => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        }))
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        }))
      }))
    }
  })
}))

describe('Auth Provider Integration', () => {
  beforeEach(() => {
    // Reset counters and trackers
    supabaseClientCount = 0
    window.__supabaseInstances = []
    warnings.length = 0
    errors.length = 0

    // Spy on console to detect warnings
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((msg) => {
      warnings.push(msg)
    })

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((msg) => {
      errors.push(msg)
    })
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    delete window.__supabaseInstances
  })

  test('should mount AuthProvider only once in the component tree', () => {
    let authProviderCount = 0

    // Mock AuthProvider to count instantiations
    const OriginalAuthProvider = jest.requireActual('@contexts/AuthContext').AuthProvider
    jest.spyOn(require('@contexts/AuthContext'), 'AuthProvider').mockImplementation(({ children }) => {
      authProviderCount++
      // Mark the provider in the DOM for verification
      return (
        <div data-testid={`auth-provider-${authProviderCount}`}>
          {children}
        </div>
      )
    })

    render(<App />)

    // AuthProvider should be mounted exactly once
    expect(authProviderCount).toBe(1)
    expect(screen.getByTestId('auth-provider-1')).toBeInTheDocument()
    expect(screen.queryByTestId('auth-provider-2')).not.toBeInTheDocument()
  })

  test('should not create duplicate Supabase client instances', () => {
    // Import the singleton module multiple times
    const singleton1 = require('@lib/supabaseClientSingleton')
    const singleton2 = require('@lib/supabaseClientSingleton')
    const supabase1 = require('@lib/supabase')
    const supabaseClient = require('@lib/supabaseClient')

    // All should reference the same singleton
    expect(singleton1.supabase).toBe(singleton2.supabase)
    expect(supabase1.supabase).toBe(singleton1.supabase)
    expect(supabaseClient.supabaseClient).toBe(singleton1.supabase)
  })

  test('should not show "Multiple GoTrueClient instances" warning', () => {
    render(<App />)

    // Check for the specific warning about multiple GoTrueClient instances
    const multipleClientWarnings = warnings.filter(w =>
      w && w.toString().includes('Multiple GoTrueClient instances')
    )

    expect(multipleClientWarnings.length).toBe(0)
  })

  test('should use consistent storage key across all Supabase instances', () => {
    // Trigger Supabase client creation
    const { supabase } = require('@lib/supabaseClientSingleton')

    // Check that all instances (should be just one) use the same storage key
    const storageKeys = window.__supabaseInstances.map(i => i.storageKey)
    const uniqueStorageKeys = [...new Set(storageKeys)]

    // Should only have one unique storage key
    expect(uniqueStorageKeys.length).toBeLessThanOrEqual(1)

    // If there is a storage key, it should be 'lovep-auth'
    if (uniqueStorageKeys.length > 0) {
      expect(uniqueStorageKeys[0]).toBe('lovep-auth')
    }
  })

  test('should handle auth state changes without duplicate subscriptions', async () => {
    const authStateCallbacks = []

    // Mock onAuthStateChange to track subscriptions
    const mockOnAuthStateChange = jest.fn((callback) => {
      authStateCallbacks.push(callback)
      return {
        data: { subscription: { unsubscribe: jest.fn() } }
      }
    })

    jest.spyOn(require('@lib/supabaseClientSingleton').supabase.auth, 'onAuthStateChange')
      .mockImplementation(mockOnAuthStateChange)

    render(<App />)

    // Should only have one auth state change listener from AuthProvider
    expect(authStateCallbacks.length).toBe(1)
  })

  test('should navigate to login page without hooks order error', () => {
    // This tests the full app flow to the login page
    const { container } = render(
      <BrowserRouter initialEntries={['/login']}>
        <App />
      </BrowserRouter>
    )

    // Should not have any React error boundaries triggered
    const errorBoundaries = container.querySelectorAll('[data-error-boundary]')
    expect(errorBoundaries.length).toBe(0)

    // Should not have console errors about hooks
    const hooksErrors = errors.filter(e =>
      e && e.toString().includes('fewer hooks') ||
      e && e.toString().includes('more hooks')
    )
    expect(hooksErrors.length).toBe(0)
  })
})

/**
 * Supabase Singleton Tests
 * Ensures the singleton pattern is working correctly
 */
describe('Supabase Client Singleton', () => {
  beforeEach(() => {
    // Clear module cache to test singleton behavior
    jest.resetModules()
  })

  test('should create only one Supabase client instance', () => {
    const { getSupabaseClient, _resetSingleton } = require('@lib/supabaseClientSingleton')

    // Reset singleton for clean test
    _resetSingleton()

    // Get client multiple times
    const client1 = getSupabaseClient()
    const client2 = getSupabaseClient()
    const client3 = getSupabaseClient()

    // All should be the same instance
    expect(client1).toBe(client2)
    expect(client2).toBe(client3)
  })

  test('should handle missing environment variables gracefully', () => {
    // Save original env vars
    const originalUrl = process.env.VITE_SUPABASE_URL
    const originalKey = process.env.VITE_SUPABASE_ANON_KEY

    // Remove env vars
    delete process.env.VITE_SUPABASE_URL
    delete process.env.VITE_SUPABASE_ANON_KEY

    // Clear module cache
    jest.resetModules()

    // Should return mock client without crashing
    const { getSupabaseClient } = require('@lib/supabaseClientSingleton')
    const client = getSupabaseClient()

    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()

    // Restore env vars
    process.env.VITE_SUPABASE_URL = originalUrl
    process.env.VITE_SUPABASE_ANON_KEY = originalKey
  })
})