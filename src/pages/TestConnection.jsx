import { useState } from 'react'
import { supabase } from '@lib/supabase'

function TestConnection() {
  const [results, setResults] = useState([])
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    setResults([])
    const testResults = []

    try {
      console.log('Starting tests...')
      
      // Test 1: Check Supabase client exists
      console.log('Test 1: Checking Supabase client...')
      testResults.push({
        test: 'Supabase client',
        status: supabase ? '✅ Connected' : '❌ Not connected',
        details: supabase ? 'Client initialized' : 'Client missing'
      })
      setResults([...testResults])

      // Test 2: Try to fetch from users table with timeout
      console.log('Test 2: Testing database connection...')
      const dbPromise = supabase
        .from('users')
        .select('count')
        .limit(1)
      
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ error: { message: 'Database query timeout (5s)' } }), 5000)
      )
      
      const { data: userData, error: userError } = await Promise.race([dbPromise, timeoutPromise])
      
      console.log('Database test result:', userError ? 'Failed' : 'Success')
      testResults.push({
        test: 'Database connection',
        status: userError ? '❌ Failed' : '✅ Success',
        details: userError ? userError.message : 'Can read from database'
      })
      setResults([...testResults])

      // Test 3: Check auth status with timeout
      console.log('Test 3: Checking auth session...')
      const sessionPromise = supabase.auth.getSession()
      const sessionTimeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ data: { session: null }, error: { message: 'Session check timeout (5s)' } }), 5000)
      )
      
      const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, sessionTimeoutPromise])
      
      console.log('Session test result:', sessionError ? 'Error' : 'Success', session ? 'Has session' : 'No session')
      testResults.push({
        test: 'Auth session',
        status: sessionError ? '❌ Error' : '✅ Checked',
        details: session ? `Logged in as: ${session.user.email}` : sessionError?.message || 'No active session'
      })
      setResults([...testResults])

      // Test 4: Skip auth endpoint test for now
      console.log('Test 4: Skipping auth endpoint test...')
      testResults.push({
        test: 'Auth endpoint',
        status: '⏭️ Skipped',
        details: 'Skipped to avoid hanging'
      })

    } catch (error) {
      console.error('Test error:', error)
      testResults.push({
        test: 'General error',
        status: '❌ Failed',
        details: error.message
      })
    }

    console.log('All tests complete')
    setResults(testResults)
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
        
        <button
          onClick={runTests}
          disabled={testing}
          className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{result.test}</p>
                    <p className="text-sm text-gray-600">{result.details}</p>
                  </div>
                  <span className="text-lg">{result.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
          </p>
          <p className="text-sm text-gray-600">
            Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TestConnection