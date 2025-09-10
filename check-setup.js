// LoveP Marketplace - Setup Verification Script
// Run this to check if your environment is properly configured

import { validateEnvironment } from './src/utils/validateEnv.js'

console.log('🔍 LoveP Marketplace - Environment Check')
console.log('=========================================\n')

// Check Node version
const nodeVersion = process.version
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1))
if (majorVersion >= 18) {
  console.log(`✅ Node.js ${nodeVersion} (Required: 18+)`)
} else {
  console.log(`❌ Node.js ${nodeVersion} (Required: 18+)`)
}

// Check environment variables
console.log('\n📋 Environment Variables:')
console.log('-------------------------')

const envVars = {
  'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL,
  'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY,
  'VITE_STRIPE_PUBLIC_KEY': process.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env?.VITE_STRIPE_PUBLIC_KEY,
  'VITE_APP_URL': process.env.VITE_APP_URL || import.meta.env?.VITE_APP_URL
}

let allConfigured = true

for (const [key, value] of Object.entries(envVars)) {
  if (!value) {
    console.log(`❌ ${key}: Not set`)
    allConfigured = false
  } else if (value.includes('your-') || value.includes('placeholder')) {
    console.log(`⚠️  ${key}: Using placeholder value`)
    allConfigured = false
  } else {
    const displayValue = key.includes('KEY') 
      ? value.substring(0, 20) + '...' 
      : value
    console.log(`✅ ${key}: ${displayValue}`)
  }
}

// Check dependencies
console.log('\n📦 Dependencies:')
console.log('----------------')

try {
  const packageJson = await import('./package.json', { assert: { type: 'json' } })
  const deps = packageJson.default.dependencies

  const requiredDeps = [
    '@supabase/supabase-js',
    '@stripe/stripe-js',
    'react',
    'react-router-dom',
    'react-hot-toast',
    'tailwindcss'
  ]

  for (const dep of requiredDeps) {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`)
    } else {
      console.log(`❌ ${dep}: Not installed`)
    }
  }
} catch (error) {
  console.log('⚠️  Could not read package.json')
}

// Summary
console.log('\n📊 Summary:')
console.log('-----------')

if (allConfigured) {
  console.log('✅ Environment is properly configured!')
  console.log('   Run "npm run dev" to start the application.')
} else {
  console.log('⚠️  Environment needs configuration.')
  console.log('   Please update your .env file with actual values.')
  console.log('\nQuick Setup:')
  console.log('1. Create a Supabase project at https://app.supabase.com')
  console.log('2. Get your Stripe keys from https://dashboard.stripe.com')
  console.log('3. Update the .env file with your credentials')
}

console.log('\n💡 For detailed setup instructions, see:')
console.log('   - Setup Guide: Open the "LoveP Complete Setup & Launch Guide" artifact')
console.log('   - Bug Fixes: Open the "LoveP Bug Fixes & Improvements" artifact')
console.log('\n')
