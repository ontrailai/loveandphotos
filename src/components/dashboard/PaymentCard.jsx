/**
 * Payment Card Component
 * Displays payment plan information and allows making payments
 */

import { useState } from 'react'
import { CreditCard, DollarSign, Calendar, CheckCircle, AlertCircle, Info, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import Card from '@components/ui/Card'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import { supabase } from '@lib/supabase'
import toast from 'react-hot-toast'
import PaymentModal from './PaymentModal'

const PaymentCard = ({ booking, onPaymentUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [showCustomAmount, setShowCustomAmount] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)

  // Debug: Log booking data
  console.log('💳 PaymentCard - Booking Data:', {
    id: booking.id,
    total_amount: booking.total_amount,
    deposit_amount: booking.deposit_amount,
    payment_plan: booking.payment_plan,
    payment_schedule: booking.payment_schedule,
    payment_status: booking.payment_status,
    deposit_paid: booking.deposit_paid,
    final_amount: booking.final_amount,
    event_date: booking.event_date
  })

  const totalAmount = parseFloat(booking.total_amount || 0)
  const depositAmount = parseFloat(booking.deposit_amount || 0)
  const paymentPlan = booking.payment_plan || 'full'
  const paymentSchedule = booking.payment_schedule || []
  const paymentStatus = booking.payment_status || 'pending'
  const eventDate = booking.event_date ? new Date(booking.event_date) : null

  // Calculate amounts
  const paidAmount = paymentSchedule.reduce((sum, payment) => {
    return payment.status === 'paid' ? sum + parseFloat(payment.amount || 0) : sum
  }, 0)

  const remainingAmount = totalAmount - paidAmount

  // Get next payment due
  // Payment schedule can have two formats:
  // 1. Generated items: { amount_cents, date, description } - no status field
  // 2. Actual payments: { amount, status, due_date }
  const nextPayment = paymentSchedule.find(p => {
    // If it has a status field, check if it's pending
    if (p.status !== undefined) {
      return p.status === 'pending'
    }
    // If no status field, it's a generated schedule item that hasn't been paid yet
    // These items are still in the schedule and haven't been converted to paid status
    if (p.amount_cents && !p.status) {
      return true // This is an unpaid future payment
    }
    return false
  })

  // Convert amount_cents to dollars if needed for display
  const nextPaymentAmount = nextPayment
    ? (nextPayment.amount_cents ? nextPayment.amount_cents / 100 : parseFloat(nextPayment.amount))
    : 0

  const nextPaymentDate = nextPayment
    ? (nextPayment.date || nextPayment.due_date)
    : null

  // Debug payment calculations
  console.log('💰 Payment Calculations:', {
    bookingId: booking.id,
    totalAmount,
    paidAmount,
    remainingAmount,
    paymentSchedule,
    nextPayment
  })

  // Calculate days until event and cutoff
  const getDaysUntilEvent = () => {
    if (!eventDate) return null
    return Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24))
  }

  const getCutoffInfo = () => {
    if (!eventDate) return null
    const cutoffDate = new Date(eventDate)
    cutoffDate.setDate(cutoffDate.getDate() - 60)
    const daysUntilCutoff = Math.ceil((cutoffDate - new Date()) / (1000 * 60 * 60 * 24))
    const monthsUntilCutoff = Math.max(1, Math.floor(daysUntilCutoff / 30))
    return { cutoffDate, daysUntilCutoff, monthsUntilCutoff }
  }

  // Get detailed payment plan information (matching PaymentStep.jsx logic)
  const getPaymentPlanDetails = () => {
    const daysUntilEvent = getDaysUntilEvent()
    const cutoffInfo = getCutoffInfo()

    if (!daysUntilEvent || !cutoffInfo) {
      // Fallback for bookings without event date
      return {
        title: paymentPlan === 'full' ? 'Full Payment' : 'Payment Plan',
        description: `Total amount: $${totalAmount.toLocaleString()}`,
        terms: [
          paidAmount > 0 ? `Amount paid: $${paidAmount.toFixed(2)}` : 'No payments made yet',
          `Remaining balance: $${remainingAmount.toFixed(2)}`,
          'Contact photographer for payment schedule details'
        ]
      }
    }

    const { monthsUntilCutoff } = cutoffInfo

    // Within 60 days: late fee applies, only full payment
    if (daysUntilEvent <= 60) {
      const lateFee = booking.late_fee || 450
      return {
        title: 'Full Payment (Late Booking)',
        description: `Payment required within 60 days of event`,
        terms: [
          booking.late_fee ? `Late booking fee: $${lateFee}` : 'Late booking period',
          'Payment plans not available for bookings within 60 days',
          'Full payment required to secure your date',
          `Event in ${daysUntilEvent} days`
        ]
      }
    }

    // Payment plan specific details
    if (paymentPlan === 'deposit500' || paymentPlan === 'deposit+3') {
      // Get monthly payment amount from the payment schedule if available
      const monthlyScheduleItem = paymentSchedule.find(p =>
        p.description && p.description.includes('Monthly payment') && p.amount_cents
      )
      const monthlyPaymentFromSchedule = monthlyScheduleItem
        ? (monthlyScheduleItem.amount_cents / 100)
        : null

      // Fallback calculation if no schedule
      const remainingBalance = totalAmount - 500
      const monthlyPayment = monthlyPaymentFromSchedule || Math.round(remainingBalance / monthsUntilCutoff)

      // Count how many monthly payments in the schedule
      const monthlyPaymentsCount = paymentSchedule.filter(p =>
        p.description && p.description.includes('Monthly payment')
      ).length

      return {
        title: '$500 Deposit + Monthly Payments',
        description: `$500 deposit today, then ${monthlyPaymentsCount || monthsUntilCutoff} monthly payments of $${monthlyPayment.toFixed(2)}`,
        terms: [
          depositAmount ? `Deposit: $${depositAmount.toFixed(2)}` : '$500 deposit required',
          `${monthlyPaymentsCount || monthsUntilCutoff} monthly payments of $${monthlyPayment.toFixed(2)} each`,
          'All payments complete 60 days before event',
          daysUntilEvent < 90 ? 'No processing fee for this plan' : 'Payments automatically charged monthly'
        ]
      }
    } else if (paymentPlan === 'monthly199' || paymentPlan === 'installments') {
      const processingFee = 150
      const monthlyPayment = 199
      const monthsAvailable = Math.max(1, Math.floor(cutoffInfo.daysUntilCutoff / 30))
      const firstPayment = monthlyPayment + processingFee
      const totalMonthlyPayments = (monthsAvailable * monthlyPayment) + processingFee
      const finalLumpSum = totalAmount - totalMonthlyPayments

      return {
        title: 'Monthly Payment Plan',
        description: `Fixed $${monthlyPayment}/month payments + final balance due 60 days before event`,
        terms: [
          `First payment: $${firstPayment.toLocaleString()} ($${monthlyPayment} + $${processingFee} processing fee)`,
          `${monthsAvailable - 1} monthly payments of $${monthlyPayment} each`,
          `Final balance: $${finalLumpSum.toLocaleString()} due 60 days before event`,
          `Total payments: ${monthsAvailable + 1}`,
          'Remaining balance paid as lump sum at 60-day cutoff'
        ]
      }
    } else {
      // Full payment plan
      return {
        title: 'Full Payment',
        description: `Complete payment of $${totalAmount.toLocaleString()} for your photography package`,
        terms: [
          'Full payment secures your date',
          'Includes all package features',
          'Service agreement active',
          paidAmount > 0 ? `Paid: $${paidAmount.toFixed(2)}` : 'No additional fees or charges'
        ]
      }
    }
  }

  const planDetails = getPaymentPlanDetails()

  // Calculate installment amount based on payment plan
  const getInstallmentAmount = () => {
    if (paymentPlan === 'installments' || paymentPlan === 'monthly199') {
      return 199
    } else if (paymentPlan === 'deposit+3' || paymentPlan === 'deposit500') {
      const cutoffInfo = getCutoffInfo()
      if (cutoffInfo) {
        const remainingBalance = totalAmount - (depositAmount || 500)
        return Math.round(remainingBalance / cutoffInfo.monthsUntilCutoff)
      }
    }
    return 0
  }

  const installmentAmount = getInstallmentAmount()

  // Payment plan labels
  const paymentPlanLabels = {
    'full': 'Pay in Full',
    'deposit+3': 'Deposit + Monthly Payments',
    'deposit500': '$500 Deposit + Monthly Payments',
    'installments': 'Monthly Installments',
    'monthly199': 'Monthly Payment Plan'
  }

  const handleMakePayment = async (amount, isFullPayment = false) => {
    // Open payment modal instead of redirecting
    setPaymentAmount(amount)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    // Refresh dashboard data instead of full page reload
    if (onPaymentUpdate) {
      onPaymentUpdate()
    }
    toast.success('Payment processed successfully!')
  }

  const getPaymentStatusBadge = () => {
    if (paymentStatus === 'paid') {
      return <Badge variant="success" size="sm">Paid in Full</Badge>
    }
    if (remainingAmount === 0) {
      return <Badge variant="success" size="sm">Paid</Badge>
    }
    if (paidAmount > 0) {
      return <Badge variant="warning" size="sm">Partially Paid</Badge>
    }
    return <Badge variant="default" size="sm">Payment Pending</Badge>
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Payment</h3>
            <p className="text-sm text-muted-foreground">
              {paymentPlanLabels[paymentPlan] || 'Payment Plan'}
            </p>
          </div>
        </div>
        {getPaymentStatusBadge()}
      </div>

      {/* Payment Summary */}
      <div className="space-y-3 mb-4 pb-4 border-b border-border">
        {/* Package Details */}
        {booking.personalization_data?.package && (
          <div className="mb-3 pb-3 border-b border-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                {booking.personalization_data.package.packageTitle}
              </span>
              <span className="text-sm font-semibold">
                ${(booking.personalization_data.package.packagePrice || 0).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {booking.personalization_data.package.hoursBooked} hours
              {booking.personalization_data.package.isPhotoVideo && ' • Photo & Video'}
            </p>
          </div>
        )}

        {/* Add-ons */}
        {booking.personalization_data?.addons && booking.personalization_data.addons.length > 0 && (
          <div className="mb-3 pb-3 border-b border-border/50">
            <div className="text-xs font-medium text-muted-foreground mb-2">Add-ons</div>
            {booking.personalization_data.addons.map((addon, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm text-foreground">
                  {addon.title}
                  {addon.qty > 1 && ` (×${addon.qty})`}
                </span>
                <span className="text-sm font-semibold">
                  ${(addon.price * (addon.qty || 1)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Total Amount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="font-semibold">${totalAmount.toFixed(2)}</span>
        </div>

        {paidAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Paid</span>
            <span className="font-semibold text-green-600">-${paidAmount.toFixed(2)}</span>
          </div>
        )}

        {remainingAmount > 0 && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount Due</span>
              <span className="text-lg font-bold text-primary">${remainingAmount.toFixed(2)}</span>
            </div>
            {/* Next Payment Due */}
            {nextPayment && nextPaymentDate && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Next Payment Due</span>
                  <span className="text-xs font-medium text-foreground">
                    {format(parseISO(nextPaymentDate), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">Next Payment Amount</span>
                  <span className="text-sm font-bold text-primary">
                    ${nextPaymentAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Plan Details */}
      <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-100">
        <h4 className="font-medium text-primary-900 mb-2 flex items-center">
          <Info className="w-4 h-4 mr-2 text-primary-600" />
          {planDetails.title}
        </h4>
        <p className="text-sm text-primary-700 mb-3">
          {planDetails.description}
        </p>
        <ul className="space-y-1">
          {planDetails.terms.map((term, index) => (
            <li key={index} className="text-xs text-primary-600 flex items-start">
              <Check className="w-3 h-3 mr-1 mt-0.5 text-primary-500 flex-shrink-0" />
              {term}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment History */}
      {paidAmount > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Payment History
          </h4>
          <div className="space-y-2">
            {paymentSchedule
              .filter(payment => payment.status === 'paid')
              .map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Payment #{paymentSchedule.indexOf(payment) + 1}
                      </p>
                      <p className="text-xs text-green-700">
                        Paid on {payment.paid_at ? format(parseISO(payment.paid_at), 'MMM d, yyyy') : format(parseISO(payment.due_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-900">
                      ${parseFloat(payment.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600">Paid</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Upcoming Payments */}
      {paymentSchedule.filter(p => {
        // Filter for pending payments (either explicit status or unpaid schedule items)
        if (p.status === 'pending') return true
        if (p.amount_cents && !p.status) {
          // Check if this schedule item hasn't been paid yet
          const amountDollars = p.amount_cents / 100
          const alreadyPaid = paymentSchedule.some(payment =>
            payment.status === 'paid' &&
            Math.abs(parseFloat(payment.amount) - amountDollars) < 0.01
          )
          return !alreadyPaid
        }
        return false
      }).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Upcoming Payments
          </h4>
          <div className="space-y-2">
            {paymentSchedule
              .filter(payment => {
                if (payment.status === 'pending') return true
                if (payment.amount_cents && !payment.status) {
                  const amountDollars = payment.amount_cents / 100
                  const alreadyPaid = paymentSchedule.some(p =>
                    p.status === 'paid' &&
                    Math.abs(parseFloat(p.amount) - amountDollars) < 0.01
                  )
                  return !alreadyPaid
                }
                return false
              })
              .map((payment, index) => {
                const amount = payment.amount_cents
                  ? (payment.amount_cents / 100)
                  : parseFloat(payment.amount)
                const dueDate = payment.date || payment.due_date
                const description = payment.description || `Payment #${index + 1}`

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {description}
                        </p>
                        {dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due: {format(parseISO(dueDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        ${amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Pending
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Payment Actions */}
      {remainingAmount > 0 && (
        <div className="space-y-2">
          {/* Pay Next Installment (from schedule) */}
          {nextPayment && nextPaymentAmount > 0 && (
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => handleMakePayment(nextPaymentAmount)}
              disabled={loading}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Pay Next: ${nextPaymentAmount.toFixed(2)}
            </Button>
          )}

          {/* Pay Monthly Installment (for plans without schedule yet) */}
          {!nextPayment && installmentAmount > 0 && paymentSchedule.length === 0 && (
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => handleMakePayment(installmentAmount)}
              disabled={loading}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Pay Monthly: ${installmentAmount.toFixed(2)}
            </Button>
          )}

          {/* Pay Full Balance */}
          {paymentPlan !== 'full' && remainingAmount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleMakePayment(remainingAmount, true)}
              disabled={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Full Balance: ${remainingAmount.toFixed(2)}
            </Button>
          )}

          {/* Pay in Full (for full payment plan) */}
          {paymentPlan === 'full' && paymentStatus === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => handleMakePayment(totalAmount, true)}
              disabled={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${totalAmount.toFixed(2)}
            </Button>
          )}

          {/* Custom Partial Payment - Available for all payment plans */}
          {remainingAmount > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              {!showCustomAmount ? (
                <button
                  onClick={() => setShowCustomAmount(true)}
                  className="text-sm text-primary hover:underline w-full text-center"
                >
                  {paymentPlan === 'full' ? 'Make a partial payment' : 'Make a custom partial payment'}
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Custom Payment Amount
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        max={remainingAmount}
                        step="0.01"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full pl-7 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const amount = parseFloat(customAmount)
                        if (amount > 0 && amount <= remainingAmount) {
                          handleMakePayment(amount, false)
                          setCustomAmount('')
                          setShowCustomAmount(false)
                        } else {
                          toast.error(`Please enter an amount between $1 and $${remainingAmount.toFixed(2)}`)
                        }
                      }}
                      disabled={loading || !customAmount}
                    >
                      Pay
                    </Button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCustomAmount(false)
                      setCustomAmount('')
                    }}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fully Paid Message */}
      {remainingAmount === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Payment Complete! Thank you.
            </p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        bookingId={booking.id}
        amount={paymentAmount}
        paymentPlan={paymentPlan}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </Card>
  )
}

export default PaymentCard
