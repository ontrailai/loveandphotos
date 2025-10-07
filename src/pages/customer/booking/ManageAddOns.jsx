/**
 * Manage Add-Ons Page
 * Allows customers to purchase additional add-ons for existing bookings
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import AddOnsGrid from '@components/booking/AddOnsGrid'
import TotalsPanel from '@components/booking/TotalsPanel'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import { supabase } from '@lib/supabase'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { differenceInDays, parseISO } from 'date-fns'
import { getFirstNameOnly } from '@lib/privacy/sanitizeTalentData'

const ManageAddOns = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [existingAddons, setExistingAddons] = useState([])
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    if (user && bookingId) {
      loadBooking()
      loadExistingAddons()
    }
  }, [user, bookingId])

  const loadBooking = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          photographers (
            id,
            users!inner (
              full_name
            )
          )
        `)
        .eq('id', bookingId)
        .eq('customer_id', user.id)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Booking not found')
        navigate('/dashboard')
        return
      }

      setBooking(data)
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Failed to load booking')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadExistingAddons = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_addons')
        .select(`
          *,
          addons (
            name,
            price_cents,
            kind
          )
        `)
        .eq('booking_id', bookingId)

      if (error && error.code !== 'PGRST116') throw error
      setExistingAddons(data || [])
    } catch (error) {
      console.error('Error loading existing add-ons:', error)
    }
  }

  const handleSelectionChange = (newSelections) => {
    setSelectedAddons(newSelections)
  }

  const handleCheckout = async () => {
    if (selectedAddons.length === 0) {
      toast.error('Please select at least one add-on')
      return
    }

    try {
      setProcessingPayment(true)

      // Calculate total amount
      const totalAmount = selectedAddons.reduce((sum, addon) => {
        return sum + (addon.price * (addon.qty || 1))
      }, 0)

      // Create payment intent for add-ons
      const response = await fetch('/api/payments/create-addon-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          addons: selectedAddons,
          totalAmount,
          userEmail: user.email,
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const { clientSecret, paymentIntentId } = await response.json()

      // For now, navigate to a payment page or show payment modal
      // You can integrate Stripe here similar to the main payment flow
      toast.success('Add-ons added to your booking!')
      navigate('/dashboard')

    } catch (error) {
      console.error('Error processing add-ons payment:', error)
      toast.error(error.message || 'Failed to process payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dusty-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-dusty-600 mt-4">Loading booking...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const daysUntilEvent = differenceInDays(parseISO(booking.event_date), new Date())
  const isCutoff = daysUntilEvent < 3

  // Build package context for the add-ons grid
  const packageContext = {
    selectedDate: booking.event_date,
    packageType: 'photoVideo',
    packagePrice: booking.total_amount || 0,
    hoursBooked: booking.hours_booked || 0,
    isPhotoVideo: true
  }

  return (
    <div className="min-h-screen bg-dusty-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-dusty-900 mb-2">
            Manage Add-Ons
          </h1>
          <p className="text-dusty-600">
            Add extra services to your booking with {getFirstNameOnly(booking.photographers?.users?.full_name)}
          </p>
          <p className="text-sm text-dusty-500 mt-1">
            Event Date: {new Date(booking.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Cutoff Warning */}
        {isCutoff && (
          <Card className="mb-6 p-6 bg-red-50 border-red-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-lg">⚠</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Add-ons unavailable</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your event is less than 3 days away. Please contact your photographer directly for any changes.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Existing Add-Ons */}
        {existingAddons.length > 0 && (
          <Card className="mb-6 p-6">
            <h3 className="font-semibold text-dusty-900 mb-3">Current Add-Ons</h3>
            <div className="space-y-2">
              {existingAddons.map((addon) => (
                <div key={addon.id} className="flex justify-between items-center text-sm">
                  <span className="text-dusty-700">{addon.addons?.name}</span>
                  <span className="text-dusty-900 font-medium">
                    ${(addon.addons?.price_cents / 100).toFixed(2)} × {addon.quantity}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!isCutoff && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Add-Ons Grid */}
            <div className="lg:col-span-2">
              <AddOnsGrid
                photographerId={booking.photographer_id}
                packageContext={packageContext}
                selectedAddons={selectedAddons}
                onSelectionChange={handleSelectionChange}
                onInfoClick={(addon) => {
                  // Optional: show info modal
                }}
              />
            </div>

            {/* Totals Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <TotalsPanel
                  packageContext={packageContext}
                  selectedAddons={selectedAddons}
                  onRemoveAddon={(addonId) => {
                    setSelectedAddons(prev => prev.filter(a => a.id !== addonId))
                  }}
                />

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-4"
                  onClick={handleCheckout}
                  disabled={selectedAddons.length === 0 || processingPayment}
                  loading={processingPayment}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {processingPayment ? 'Processing...' : 'Checkout Add-Ons'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageAddOns
