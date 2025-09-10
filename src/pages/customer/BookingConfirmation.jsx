/**
 * Booking Confirmation Component  
 * Shows booking confirmation and triggers email notifications
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { 
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CameraIcon,
  MailIcon,
  FileTextIcon,
  DownloadIcon,
  CreditCardIcon,
  UserIcon,
  PhoneIcon,
  ArrowRightIcon,
  PrinterIcon,
  ShareIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import { supabase } from '@lib/supabase'
import { sendConfirmationEmail } from '@lib/emailClient'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const BookingConfirmation = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const sessionId = searchParams.get('session_id')
  const bookingId = searchParams.get('booking_id')
  
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [contractUrl, setContractUrl] = useState('')

  useEffect(() => {
    if (sessionId) {
      verifyPaymentAndLoadBooking()
    } else if (bookingId) {
      loadBooking(bookingId)
    } else {
      toast.error('Invalid confirmation link')
      navigate('/dashboard')
    }
  }, [sessionId, bookingId])

  const verifyPaymentAndLoadBooking = async () => {
    try {
      // Verify Stripe payment session
      const response = await fetch(`/api/verify-payment?session_id=${sessionId}`)
      const paymentData = await response.json()
      
      if (!paymentData.success) {
        throw new Error('Payment verification failed')
      }

      const bookingId = paymentData.metadata?.bookingId
      
      if (!bookingId) {
        throw new Error('Booking ID not found')
      }

      // Update booking with payment confirmation
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          booking_status: 'confirmed',
          stripe_session_id: sessionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Load booking details
      await loadBooking(bookingId)
      
      // Send confirmation email
      await sendConfirmationEmails(bookingId)
      
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast.error('Failed to verify payment')
      navigate('/dashboard')
    }
  }

  const loadBooking = async (id) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          photographers (
            *,
            users!inner (
              full_name,
              email,
              phone,
              avatar_url
            ),
            pay_tiers (
              name,
              hourly_rate,
              badge_color
            )
          ),
          packages (
            title,
            duration_minutes,
            includes,
            deliverables
          )
        `)
        .eq('id', id)
        .eq('customer_id', user.id)
        .single()

      if (error) throw error
      
      if (!data) {
        toast.error('Booking not found')
        navigate('/dashboard')
        return
      }

      setBooking(data)
      
      // Generate contract if not exists
      if (!data.contract_url) {
        await generateContract(data)
      } else {
        setContractUrl(data.contract_url)
      }
      
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const generateContract = async (bookingData) => {
    try {
      // Generate contract HTML
      const contractHtml = generateContractHTML(bookingData)
      
      // Save contract to storage
      const contractBlob = new Blob([contractHtml], { type: 'text/html' })
      const contractFile = new File([contractBlob], `contract-${bookingData.id}.html`)
      
      const filePath = `contracts/${bookingData.id}/contract.html`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, contractFile, {
          contentType: 'text/html',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath)

      setContractUrl(publicUrl)
      
      // Update booking with contract URL
      await supabase
        .from('bookings')
        .update({
          contract_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingData.id)
        
    } catch (error) {
      console.error('Error generating contract:', error)
    }
  }

  const generateContractHTML = (bookingData) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Photography Service Contract</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .signature { margin-top: 50px; border-top: 1px solid #333; padding-top: 10px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <h1>Photography Service Contract</h1>
        
        <div class="section">
          <h2>Agreement Details</h2>
          <p>This agreement is entered into on ${format(new Date(), 'MMMM dd, yyyy')} between:</p>
          <table>
            <tr>
              <td><strong>Client:</strong></td>
              <td>${profile?.full_name}</td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td>${profile?.email}</td>
            </tr>
            <tr>
              <td><strong>Phone:</strong></td>
              <td>${profile?.phone}</td>
            </tr>
            <tr>
              <td><strong>Photographer:</strong></td>
              <td>${bookingData.photographers?.users?.full_name}</td>
            </tr>
            <tr>
              <td><strong>Package:</strong></td>
              <td>${bookingData.packages?.title}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Event Details</h2>
          <table>
            <tr>
              <td><strong>Date:</strong></td>
              <td>${format(new Date(bookingData.event_date), 'MMMM dd, yyyy')}</td>
            </tr>
            <tr>
              <td><strong>Time:</strong></td>
              <td>${bookingData.event_time}</td>
            </tr>
            <tr>
              <td><strong>Duration:</strong></td>
              <td>${bookingData.packages?.duration_minutes} minutes</td>
            </tr>
            <tr>
              <td><strong>Venue:</strong></td>
              <td>${bookingData.venue_name}</td>
            </tr>
            <tr>
              <td><strong>Address:</strong></td>
              <td>
                ${bookingData.venue_address?.street}, 
                ${bookingData.venue_address?.city}, 
                ${bookingData.venue_address?.state} 
                ${bookingData.venue_address?.zip}
              </td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Payment Terms</h2>
          <table>
            <tr>
              <td><strong>Total Amount:</strong></td>
              <td>$${bookingData.total_amount}</td>
            </tr>
            <tr>
              <td><strong>Payment Status:</strong></td>
              <td>PAID IN FULL</td>
            </tr>
            <tr>
              <td><strong>Payment Date:</strong></td>
              <td>${format(new Date(), 'MMMM dd, yyyy')}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Deliverables</h2>
          <ul>
            ${bookingData.packages?.deliverables?.map(item => `<li>${item}</li>`).join('') || ''}
          </ul>
          <p>Photos will be delivered within 4-6 weeks after the event date.</p>
        </div>
        
        <div class="section">
          <h2>Cancellation Policy</h2>
          <p>• Cancellations more than 30 days before event: 50% refund</p>
          <p>• Cancellations 15-30 days before event: 25% refund</p>
          <p>• Cancellations less than 15 days before event: No refund</p>
        </div>
        
        <div class="section">
          <h2>Terms and Conditions</h2>
          <p>1. The photographer retains copyright of all images</p>
          <p>2. Client has personal use rights for all delivered images</p>
          <p>3. Photographer may use images for portfolio and marketing</p>
          <p>4. Travel fees may apply for venues beyond 25 miles</p>
          <p>5. Overtime rates apply for coverage beyond contracted hours</p>
        </div>
        
        <div class="signature">
          <p><strong>Electronic Signature Confirmation</strong></p>
          <p>By completing payment, both parties agree to the terms outlined in this contract.</p>
          <p>Date: ${format(new Date(), 'MMMM dd, yyyy, h:mm a')}</p>
        </div>
      </body>
      </html>
    `
  }

  const sendConfirmationEmails = async (bookingId) => {
    setSendingEmail(true)
    
    try {
      // Send to customer
      await sendConfirmationEmail({
        bookingId,
        recipientType: 'customer'
      })
      
      // Send to photographer
      await sendConfirmationEmail({
        bookingId,
        recipientType: 'photographer'
      })
      
      toast.success('Confirmation emails sent!')
    } catch (error) {
      console.error('Error sending emails:', error)
    } finally {
      setSendingEmail(false)
    }
  }

  const handlePrintContract = () => {
    window.open(contractUrl, '_blank')?.print()
  }

  const handleShareBooking = () => {
    const shareUrl = `${window.location.origin}/booking/${booking.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Booking link copied to clipboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Success Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-display font-bold text-dusty-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-dusty-600">
            Your photography session has been successfully booked
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Summary */}
        <Card className="mb-8">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-dusty-900">
                Booking Details
              </h2>
              <Badge variant="success" size="lg">
                Confirmed
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Photographer Info */}
            <div>
              <h3 className="font-medium text-dusty-900 mb-4">Your Photographer</h3>
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={booking.photographers?.users?.avatar_url || `https://ui-avatars.com/api/?name=${booking.photographers?.users?.full_name}`}
                  alt={booking.photographers?.users?.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-dusty-900">
                    {booking.photographers?.users?.full_name}
                  </p>
                  <Badge variant={booking.photographers?.pay_tiers?.name?.toLowerCase()} size="sm">
                    {booking.photographers?.pay_tiers?.name} Photographer
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-dusty-600">
                  <MailIcon className="w-4 h-4 mr-2" />
                  {booking.photographers?.users?.email}
                </div>
                <div className="flex items-center text-dusty-600">
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  {booking.photographers?.users?.phone}
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div>
              <h3 className="font-medium text-dusty-900 mb-4">Event Details</h3>
              <div className="space-y-3">
                <div className="flex items-center text-dusty-700">
                  <CalendarIcon className="w-5 h-5 mr-3 text-dusty-400" />
                  {format(new Date(booking.event_date), 'EEEE, MMMM dd, yyyy')}
                </div>
                <div className="flex items-center text-dusty-700">
                  <ClockIcon className="w-5 h-5 mr-3 text-dusty-400" />
                  {booking.event_time} • {booking.packages?.duration_minutes} minutes
                </div>
                <div className="flex items-center text-dusty-700">
                  <MapPinIcon className="w-5 h-5 mr-3 text-dusty-400" />
                  <div>
                    <p>{booking.venue_name}</p>
                    <p className="text-sm text-dusty-600">
                      {booking.venue_address?.street}, {booking.venue_address?.city}, {booking.venue_address?.state} {booking.venue_address?.zip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package & Payment */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium text-dusty-900 mb-3">Package</h3>
                <Card className="bg-gray-50">
                  <h4 className="font-semibold text-dusty-900 mb-2">
                    {booking.packages?.title}
                  </h4>
                  {booking.packages?.includes && (
                    <ul className="space-y-1">
                      {booking.packages.includes.map((item, index) => (
                        <li key={index} className="text-sm text-dusty-600 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <div>
                <h3 className="font-medium text-dusty-900 mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-dusty-700">
                    <span>Package Price</span>
                    <span className="font-semibold">${booking.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-green-600 text-lg pt-2 border-t">
                    <span className="font-semibold">Total Paid</span>
                    <span className="font-bold">${booking.total_amount}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <CreditCardIcon className="w-4 h-4 mr-2" />
                    Paid via Stripe
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-dusty-900 mb-6">
            What's Next?
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blush-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blush-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium text-dusty-900 mb-1">
                  Complete Your Style Quiz
                </h3>
                <p className="text-dusty-600 text-sm mb-2">
                  Help your photographer understand your vision
                </p>
                {!booking.personalization_data?.quizCompleted && (
                  <Link to={`/book/quiz/${booking.id}`}>
                    <Button size="sm" variant="outline">
                      Take Quiz
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
                {booking.personalization_data?.quizCompleted && (
                  <Badge variant="success">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-sage-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-medium text-dusty-900 mb-1">
                  Review Your Contract
                </h3>
                <p className="text-dusty-600 text-sm mb-2">
                  Download or print your service agreement
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={handlePrintContract}>
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <a href={contractUrl} download>
                    <Button size="sm" variant="outline">
                      <DownloadIcon className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-dusty-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-dusty-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-medium text-dusty-900 mb-1">
                  Prepare for Your Session
                </h3>
                <p className="text-dusty-600 text-sm">
                  Your photographer will contact you 1 week before the event to finalize details
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-yellow-600 font-semibold text-sm">4</span>
              </div>
              <div>
                <h3 className="font-medium text-dusty-900 mb-1">
                  Receive Your Photos
                </h3>
                <p className="text-dusty-600 text-sm">
                  Photos will be delivered within 4-6 weeks after your event
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/dashboard">
            <Button size="lg">
              Go to Dashboard
            </Button>
          </Link>
          <Button size="lg" variant="outline" onClick={handleShareBooking}>
            <ShareIcon className="w-5 h-5 mr-2" />
            Share Booking
          </Button>
        </div>

        {/* Email Status */}
        {sendingEmail && (
          <div className="mt-8 text-center text-dusty-600">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blush-500 mr-2"></div>
              Sending confirmation emails...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingConfirmation
