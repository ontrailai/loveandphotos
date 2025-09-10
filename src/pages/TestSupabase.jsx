import { useState } from 'react'
import { supabase } from '../lib/supabase'  // Fixed import path

const TestSupabase = () => {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    console.log('Test button clicked!')
    setLoading(true)
    setResult('Testing connection and database...\n')
    
    try {
      // Test 1: Check if Supabase client exists
      if (!supabase) {
        setResult('❌ Supabase client not initialized')
        return
      }
      setResult(prev => prev + '✅ Supabase client initialized\n\n')
      
      // Test 2: Check if table exists
      setResult(prev => prev + 'Checking if contact_submissions table exists...\n')
      const { data: tables, error: tableError } = await supabase
        .from('contact_submissions')
        .select('*')
        .limit(1)
      
      if (tableError && !tableError.message.includes('no rows')) {
        setResult(prev => prev + `❌ Table check failed: ${tableError.message}\n`)
        console.error('Table error:', tableError)
      } else {
        setResult(prev => prev + '✅ Table exists and is accessible\n\n')
      }
      
      // Test 3: Try to insert a test record
      setResult(prev => prev + 'Testing insert operation...\n')
      const testData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '(555) 555-5555',
        event_type: 'wedding',
        message: 'This is a test message from the test page'
      }
      
      console.log('Attempting to insert:', testData)
      
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert([testData])
        .select()
      
      if (error) {
        console.error('Insert error:', error)
        setResult(prev => prev + `❌ Insert failed!\n\nError: ${error.message}\n\nError Code: ${error.code}\n\nDetails: ${JSON.stringify(error, null, 2)}`)
      } else {
        console.log('Insert successful:', data)
        setResult(prev => prev + `✅ Success! Data inserted!\n\nInserted record:\n${JSON.stringify(data[0], null, 2)}\n\n`)
        
        // Try to delete the test record
        if (data && data[0]) {
          setResult(prev => prev + 'Cleaning up test record...\n')
          const { error: deleteError } = await supabase
            .from('contact_submissions')
            .delete()
            .eq('id', data[0].id)
          
          if (deleteError) {
            setResult(prev => prev + `⚠️ Could not delete test record: ${deleteError.message}`)
          } else {
            setResult(prev => prev + '✅ Test record cleaned up')
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setResult(prev => prev + `\n❌ Unexpected error: ${err.message}\n\nStack: ${err.stack}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Supabase Connection</h1>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Contact Form Submission'}
        </button>
        
        <div className="mt-4 p-4 bg-white rounded border">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {result || 'Click the button to test'}
          </pre>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>This will:</p>
          <ul className="list-disc ml-5">
            <li>Check if Supabase is connected</li>
            <li>Try to insert a test record</li>
            <li>Show any errors that occur</li>
            <li>Clean up the test record if successful</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TestSupabase