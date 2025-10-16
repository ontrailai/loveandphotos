import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, ProtectedRoute } from '@contexts/AuthContext'
import { GuestBookingProvider } from '@contexts/GuestBookingContext'
import { BookingFlowProvider } from '@contexts/BookingFlowContext'
import { SWRProvider } from '@providers/SWRProvider'
import { ThemeProvider } from '@contexts/ThemeContext'
import { validateEnvironment } from '@utils/validateEnv'
import DevBanner from '@components/DevBanner'
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react'
import { ReactPlugin } from '@21st-extension/react'

// Layout Components
import Layout from '@components/Layout'
import PublicLayout from '@components/PublicLayout'
import ClientLayout from '@components/ClientLayout'
import TalentLayout from '@components/TalentLayout'
import AdminLayout from '@components/AdminLayout'
import ScrollToTop from '@components/ScrollToTop'

// Page Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
  </div>
)

// Public Pages (loaded immediately)
import Home from '@pages/Home'
import Login from '@pages/Login'
import SignUp from '@pages/SignUp'
import SignupDemo from '@pages/SignupDemo'
import SignupEnhanced from '@pages/SignupEnhanced'
import ForgotPassword from '@pages/ForgotPassword'
import ResetPassword from '@pages/ResetPassword'
import AuthCallback from '@pages/AuthCallback'
import NotFound from '@pages/NotFound'
import Forbidden from '@pages/Forbidden'
import TestConnection from '@pages/TestConnection'
import PrivacyPolicy from '@pages/PrivacyPolicy'
import TermsAndConditions from '@pages/TermsAndConditions'
import Contact from '@pages/Contact'
import TestSupabase from '@pages/TestSupabase'
import About from '@pages/About'
import HowItWorks from '@pages/HowItWorks'
import ClientPricing from '@pages/ClientPricing'
import TalentPricing from '@pages/pricing/TalentPricing'
import FAQ from '@pages/FAQ'
import Resources from '@pages/Resources'
import Learn from '@pages/Learn'
import ProfilePage from '@pages/customer/ProfilePage'
import Demo from '@pages/Demo'
import TalentApplication from '@pages/TalentApplication'

// Customer Pages (lazy loaded)
const CustomerDashboard = lazy(() => import('@pages/customer/Dashboard'))
const BrowsePhotographers = lazy(() => import('@pages/photographers/PhotographersPage'))
const VideoBrowse = lazy(() => import('@pages/customer/VideoBrowse'))
const Guide = lazy(() => import('@pages/customer/Guide'))
const BookingConfirmation = lazy(() => import('@pages/customer/BookingConfirmation'))
const Quiz = lazy(() => import('@pages/customer/Quiz'))
const BookingDetails = lazy(() => import('@pages/customer/BookingDetails'))

// Lazy load placeholder pages
const LazyPlaceholders = lazy(() => import('@pages/customer/placeholders'))
const PhotographerProfile = lazy(() => import('@pages/customer/PhotographerProfile'))
const BookingPage = lazy(() =>
  import('@pages/customer/placeholders').then(module => ({ default: module.BookingPage }))
)

// Booking wizard pages
const PackageSelection = lazy(() => import('@pages/customer/booking/PackageSelection'))
const VideoSelection = lazy(() => import('@pages/customer/booking/VideoSelection'))
const AddOnsDetails = lazy(() => import('@pages/customer/booking/AddOnsDetails'))
const ManageAddOns = lazy(() => import('@pages/customer/booking/ManageAddOns'))
const AccountSetup = lazy(() => import('@pages/customer/booking/AccountSetup'))
const ContractStep = lazy(() => import('@pages/customer/booking/ContractStep'))
const PaymentStep = lazy(() => import('@pages/customer/booking/PaymentStep'))
const PaymentSuccess = lazy(() => import('@pages/customer/booking/PaymentSuccess'))
const ChangeDateSuccess = lazy(() => import('@pages/customer/booking/ChangeDateSuccess'))
const CheckoutComplete = lazy(() => import('./pages/customer/booking/CheckoutComplete'))
const BookingFlowGuard = lazy(() => import('@components/booking/BookingFlowGuard'))
const ScheduleRedirect = lazy(() => import('@components/booking/ScheduleRedirect'))
const SelectVideographer = lazy(() => import('@pages/customer/booking/SelectVideographer'))
const CustomerBookings = lazy(() =>
  import('@pages/customer/placeholders').then(module => ({ default: module.CustomerBookings }))
)
const CustomerProfile = lazy(() =>
  import('@pages/customer/placeholders').then(module => ({ default: module.CustomerProfile }))
)

// Photographer Pages (lazy loaded)
const PhotographerJobQueue = lazy(() => import('@pages/photographer/JobQueue'))
const PhotographerUploads = lazy(() => import('@pages/photographer/Uploads'))

// Talent Dashboard Pages (lazy loaded)
const TalentDashboardLayout = lazy(() => import('@components/talent/TalentDashboardLayout'))
const TalentOverview = lazy(() => import('@pages/talent/dashboard/OverviewPage'))
const TalentProfile = lazy(() => import('@pages/talent/dashboard/ProfilePage'))
const TalentCalendar = lazy(() => import('@pages/talent/dashboard/CalendarPage'))
const TalentResources = lazy(() => import('@pages/talent/dashboard/ResourcesPage'))
const TalentMessages = lazy(() => import('@pages/talent/dashboard/MessagesPage'))
const TalentBookings = lazy(() => import('@pages/talent/dashboard/BookingsPage'))
const TalentSettings = lazy(() => import('@pages/talent/dashboard/SettingsPage'))
const TalentAvailability = lazy(() => import('@pages/talent/dashboard/AvailabilityPage'))
const VideographerProfile = lazy(() => import('@pages/talent/dashboard/videographer/VideographerProfilePage'))
const TalentTraining = lazy(() => import('@pages/talent/TalentTraining'))

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
const AdminPhotographerManagement = lazy(() => import('@pages/admin/PhotographerManagement'))

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

  // Safety guard to ensure title is always 'Love & Photos'
  useEffect(() => {
    if (document?.title !== 'Love & Photos') {
      document.title = 'Love & Photos'
    }
  }, [])

  return (
    <SWRProvider>
      <ThemeProvider>
        <AuthProvider>
          <GuestBookingProvider>
            <BookingFlowProvider>
              <div className="min-h-screen bg-background text-foreground antialiased">
          {/* 21st.dev Toolbar - Development only */}
          <TwentyFirstToolbar
            config={{
              plugins: [ReactPlugin]
            }}
          />

        {/* Scroll to top on navigation */}
        <ScrollToTop />

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
            <Route path="/signin" element={<Navigate to="/login" replace />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/get-started" element={<Navigate to="/signup" replace />} />
            <Route path="/signup-demo" element={<SignupDemo />} />
            <Route path="/signup-enhanced" element={<SignupEnhanced />} />
            <Route path="/talent/apply" element={<TalentApplication />} />
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
            <Route path="/pricing/client" element={<ClientPricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/photographer-resources" element={<Resources />} />
            <Route path="/photographer-faq" element={<FAQ />} />
            <Route path="/join" element={<SignUp />} />
            {/* Redirect /talent to application gateway */}
            <Route path="/talent" element={<Navigate to="/talent/apply" replace />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/photographers" element={
              <Suspense fallback={<PageLoader />}>
                <BrowsePhotographers />
              </Suspense>
            } />
            <Route path="/videographers" element={
              <Suspense fallback={<PageLoader />}>
                <VideoBrowse />
              </Suspense>
            } />
            <Route path="/guide" element={
              <Suspense fallback={<PageLoader />}>
                <Guide />
              </Suspense>
            } />
            <Route path="/how-to-book" element={
              <Suspense fallback={<PageLoader />}>
                <Guide />
              </Suspense>
            } />
          </Route>

          {/* Customer Routes - Lazy loaded */}
          <Route element={<ClientLayout />}>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <CustomerDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/browse" element={
              <Suspense fallback={<PageLoader />}>
                <BrowsePhotographers />
              </Suspense>
            } />
            <Route path="/photographer/:id" element={
              <Suspense fallback={<PageLoader />}>
                <PhotographerProfile />
              </Suspense>
            } />
            <Route path="/book/:photographerId" element={
              <Suspense fallback={<PageLoader />}>
                <BookingPage />
              </Suspense>
            } />

            {/* Booking Wizard Routes */}
            {/* New Package Selection Flow */}
            <Route path="/booking/:photographerId/packages" element={
              <Suspense fallback={<PageLoader />}>
                <PackageSelection />
              </Suspense>
            } />
            <Route path="/booking/:photographerId/video" element={
              <Suspense fallback={<PageLoader />}>
                <VideoSelection />
              </Suspense>
            } />

            {/* Legacy Schedule Route - Keep for backwards compatibility */}
            <Route path="/booking/:photographerId/schedule" element={
              <Suspense fallback={<PageLoader />}>
                <ScheduleRedirect />
              </Suspense>
            } />
            {/* Videographer Selection Route - With photographerId parameter */}
            <Route path="/booking/:photographerId/select-videographer" element={
              <Suspense fallback={<PageLoader />}>
                <SelectVideographer />
              </Suspense>
            } />
            <Route path="/booking/:photographerId/addons" element={
              <Suspense fallback={<PageLoader />}>
                <BookingFlowGuard requiredStep="addons">
                  <AddOnsDetails />
                </BookingFlowGuard>
              </Suspense>
            } />
            <Route path="/booking/:photographerId/account" element={
              <Suspense fallback={<PageLoader />}>
                <BookingFlowGuard requiredStep="account">
                  <AccountSetup />
                </BookingFlowGuard>
              </Suspense>
            } />
            <Route path="/booking/:photographerId/contract" element={
              <Suspense fallback={<PageLoader />}>
                <BookingFlowGuard requiredStep="contract">
                  <ContractStep />
                </BookingFlowGuard>
              </Suspense>
            } />
            <Route path="/booking/:photographerId/payment" element={
              <Suspense fallback={<PageLoader />}>
                <BookingFlowGuard requiredStep="payment">
                  <PaymentStep />
                </BookingFlowGuard>
              </Suspense>
            } />
            {/* Payment Success Route */}
            <Route path="/booking/:bookingId/payment/success" element={
              <Suspense fallback={<PageLoader />}>
                <PaymentSuccess />
              </Suspense>
            } />
            {/* Date Change Success Route */}
            <Route path="/booking/:bookingId/change-date/success" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <ChangeDateSuccess />
                </Suspense>
              </ProtectedRoute>
            } />
            {/* Manage Add-Ons Route */}
            <Route path="/manage-addons/:bookingId" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <ManageAddOns />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/booking/:photographerId/confirm" element={
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
            <Route path="/booking/:bookingId" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <BookingDetails />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Checkout Complete Route (for Stripe redirect) */}
          <Route path="/checkout/complete" element={
            <Suspense fallback={<PageLoader />}>
              <CheckoutComplete />
            </Suspense>
          } />

          {/* Legacy Photographer Routes - Redirect to new Talent Dashboard */}
          <Route path="/dashboard/photographer" element={<Navigate to="/talent/dashboard" replace />} />
          <Route path="/dashboard/photographer/job-queue" element={<Navigate to="/talent/dashboard" replace />} />
          <Route path="/dashboard/photographer/uploads" element={<Navigate to="/talent/dashboard" replace />} />

          {/* Photographer Routes - Lazy loaded (Keep for backward compatibility) */}
          <Route path="/pricing/talent" element={
            <ProtectedRoute requireRole="photographer">
              <TalentLayout>
                <TalentPricing />
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/photographer-legacy" element={
            <ProtectedRoute requireRole="photographer">
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerDashboard />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/photographer/job-queue" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerJobQueue />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/photographer/uploads" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerUploads />
                </Suspense>
              </TalentLayout>
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
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerAvailability />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/portfolio" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerPortfolio />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/packages" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerPackages />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/jobs" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerJobs />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/training" element={
            <ProtectedRoute requireRole="photographer">
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerTraining />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/profile" element={
            <ProtectedRoute requireRole="photographer">
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerSettings />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />
          <Route path="/photographer/earnings" element={
            <ProtectedRoute requireRole="photographer" requireOnboarding>
              <TalentLayout>
                <Suspense fallback={<PageLoader />}>
                  <PhotographerEarnings />
                </Suspense>
              </TalentLayout>
            </ProtectedRoute>
          } />

          {/* Talent Training Route - Required before dashboard access */}
          <Route path="/talent/training" element={
            <ProtectedRoute requireRole="photographer">
              <Suspense fallback={<PageLoader />}>
                <TalentTraining />
              </Suspense>
            </ProtectedRoute>
          } />

          {/* Talent Dashboard Routes - New Dashboard System */}
          <Route path="/talent/dashboard" element={
            <ProtectedRoute requireRole="photographer">
              <Suspense fallback={<PageLoader />}>
                <TalentDashboardLayout />
              </Suspense>
            </ProtectedRoute>
          }>
            <Route index element={
              <Suspense fallback={<PageLoader />}>
                <TalentOverview />
              </Suspense>
            } />
            <Route path="profile" element={
              <Suspense fallback={<PageLoader />}>
                <TalentProfile />
              </Suspense>
            } />
            <Route path="calendar" element={
              <Suspense fallback={<PageLoader />}>
                <TalentCalendar />
              </Suspense>
            } />
            <Route path="resources" element={
              <Suspense fallback={<PageLoader />}>
                <TalentResources />
              </Suspense>
            } />
            <Route path="messages" element={
              <Suspense fallback={<PageLoader />}>
                <TalentMessages />
              </Suspense>
            } />
            <Route path="bookings" element={
              <Suspense fallback={<PageLoader />}>
                <TalentBookings />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<PageLoader />}>
                <TalentSettings />
              </Suspense>
            } />
            <Route path="availability" element={
              <Suspense fallback={<PageLoader />}>
                <TalentAvailability />
              </Suspense>
            } />
          </Route>

          {/* Videographer Dashboard Route - Separate from Photographer Dashboard */}
          <Route path="/talent/dashboard/videographer" element={
            <ProtectedRoute requireRole="photographer">
              <Suspense fallback={<PageLoader />}>
                <VideographerProfile />
              </Suspense>
            </ProtectedRoute>
          } />

          {/* Admin Routes - Lazy loaded */}
          <Route path="/admin" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout>
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/photographers" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout>
                <Suspense fallback={<PageLoader />}>
                  <AdminPhotographerManagement />
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* 403 Forbidden Page */}
          <Route path="/forbidden" element={<Forbidden />} />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
              </div>
            </BookingFlowProvider>
          </GuestBookingProvider>
        </AuthProvider>
      </ThemeProvider>
    </SWRProvider>
  )
}

export default App