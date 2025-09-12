import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, ProtectedRoute } from '@contexts/AuthContext'
import { validateEnvironment } from '@utils/validateEnv'
import DevBanner from '@components/DevBanner'

// Layout Components
import Layout from '@components/Layout'
import PublicLayout from '@components/PublicLayout'

// Page Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blush-500" />
  </div>
)

// Public Pages (loaded immediately)
import Home from '@pages/Home'
import Login from '@pages/Login'
import SignUp from '@pages/SignUp'
import ForgotPassword from '@pages/ForgotPassword'
import ResetPassword from '@pages/ResetPassword'
import AuthCallback from '@pages/AuthCallback'
import NotFound from '@pages/NotFound'
import TestConnection from '@pages/TestConnection'
import PrivacyPolicy from '@pages/PrivacyPolicy'
import TermsAndConditions from '@pages/TermsAndConditions'
import Contact from '@pages/Contact'
import TestSupabase from '@pages/TestSupabase'
import About from '@pages/About'
import HowItWorks from '@pages/HowItWorks'
import Pricing from '@pages/Pricing'
import FAQ from '@pages/FAQ'
import Resources from '@pages/Resources'

// Customer Pages (lazy loaded)
const CustomerDashboard = lazy(() => import('@pages/customer/Dashboard'))
const BrowsePhotographers = lazy(() => import('@pages/customer/Browse'))
const BookingConfirmation = lazy(() => import('@pages/customer/BookingConfirmation'))
const Quiz = lazy(() => import('@pages/customer/Quiz'))

// Lazy load placeholder pages
const LazyPlaceholders = lazy(() => import('@pages/customer/placeholders'))
const PhotographerProfile = lazy(() => 
  import('@pages/customer/placeholders').then(module => ({ default: module.PhotographerProfile }))
)
const BookingPage = lazy(() => 
  import('@pages/customer/placeholders').then(module => ({ default: module.BookingPage }))
)
const CustomerBookings = lazy(() => 
  import('@pages/customer/placeholders').then(module => ({ default: module.CustomerBookings }))
)
const CustomerProfile = lazy(() => 
  import('@pages/customer/placeholders').then(module => ({ default: module.CustomerProfile }))
)

// Photographer Pages (lazy loaded)
const PhotographerJobQueue = lazy(() => import('@pages/photographer/JobQueue'))
const PhotographerUploads = lazy(() => import('@pages/photographer/Uploads'))

// Lazy load photographer placeholders
const PhotographerPlaceholders = lazy(() => import('@pages/placeholders'))
const PhotographerDashboard = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerDashboard }))
)
const PhotographerOnboarding = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerOnboarding }))
)
const PhotographerAvailability = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerAvailability }))
)
const PhotographerPortfolio = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerPortfolio }))
)
const PhotographerPackages = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerPackages }))
)
const PhotographerJobs = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerJobs }))
)
const PhotographerTraining = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerTraining }))
)
const PhotographerSettings = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerProfile }))
)
const PhotographerEarnings = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.PhotographerEarnings }))
)

// Admin Pages (lazy loaded)
const AdminDashboard = lazy(() => 
  import('@pages/placeholders').then(module => ({ default: module.AdminDashboard }))
)

function App() {
  // Check environment configuration on mount
  useEffect(() => {
    const env = validateEnvironment()
    
    if (!env.isValid) {
      console.warn('🚨 Environment Configuration Issues Detected:')
      
      if (env.missing.length > 0) {
        console.warn('❌ Missing variables:', env.missing.join(', '))
      }
      
      if (env.placeholder.length > 0) {
        console.warn('⚠️ Using placeholder values:', env.placeholder.join(', '))
      }
      
      console.log('\n📚 Quick Setup Guide:')
      console.log('1. Create a Supabase project at https://app.supabase.com')
      console.log('2. Get your Stripe keys from https://dashboard.stripe.com')
      console.log('3. Update the .env file with your credentials')
      console.log('4. Restart the development server\n')
    } else {
      console.log('✅ Environment properly configured')
    }
    
    // Log configuration status for debugging
    if (import.meta.env.DEV) {
      console.log('📊 Configuration Status:', {
        supabase: env.isSupabaseConfigured() ? '✅' : '❌',
        stripe: env.isStripeConfigured() ? '✅' : '❌',
        appUrl: env.all.VITE_APP_URL || 'Not set'
      })
    }
  }, [])

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        {/* Development environment banner */}
        {import.meta.env.DEV && <DevBanner />}
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes - No lazy loading for better UX */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/test" element={<TestConnection />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/test-supabase" element={<TestSupabase />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/photographer-resources" element={<Resources />} />
            <Route path="/photographer-faq" element={<FAQ />} />
            <Route path="/join" element={<SignUp />} />
          </Route>

          {/* Customer Routes - Lazy loaded */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <CustomerDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/browse" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <BrowsePhotographers />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/photographer/:id" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerProfile />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/book/:photographerId" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <BookingPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/booking/confirm" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <BookingConfirmation />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/book/quiz/:bookingId" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <Quiz />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/my-bookings" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <CustomerBookings />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <CustomerProfile />
                </Suspense>
              </ProtectedRoute>
            } />
          </Route>

          {/* Photographer Routes - Lazy loaded */}
          <Route path="/dashboard/photographer" element={
            <ProtectedRoute requireRole="photographer">
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerDashboard />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/photographer/job-queue" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerJobQueue />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/photographer/uploads" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerUploads />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/onboarding/photographer" element={
            <ProtectedRoute requireRole="photographer">
              <Suspense fallback={<PageLoader />}>
                <PhotographerOnboarding />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/photographer/availability" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerAvailability />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/portfolio" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerPortfolio />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/packages" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerPackages />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/jobs" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerJobs />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/training" element={
            <ProtectedRoute requireRole="photographer">
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerTraining />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/profile" element={
            <ProtectedRoute requireRole="photographer">
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerSettings />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/earnings" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerEarnings />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Routes - Lazy loaded */}
          <Route path="/admin" element={
            <ProtectedRoute requireRole="admin">
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
