/**
 * PaymentOptions Component
 * Displays 3 selectable payment plan options for booking checkout
 */

import { Check, Clock, Calendar, DollarSign } from 'lucide-react'
import { clsx } from 'clsx'

const PaymentOptions = ({
  totalAmount,
  eventDate,
  selectedPlan = 'full',
  onSelectPlan,
  className = ''
}) => {
  // Calculate days until event and 60-day cutoff
  const today = new Date()
  const event = new Date(eventDate)
  const daysOut = Math.ceil((event.getTime() - today.getTime()) / (1000 * 3600 * 24))

  // Calculate cutoff date (60 days before event)
  const cutoffDate = new Date(event)
  cutoffDate.setDate(cutoffDate.getDate() - 60)
  const daysUntilCutoff = Math.ceil((cutoffDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
  const monthsUntilCutoff = Math.max(1, Math.floor(daysUntilCutoff / 30))

  // Determine available payment options based on days until event
  const isDepositAvailable = daysOut >= 60
  // Monthly plan available if there's at least 60 days until event
  const isMonthlyAvailable = daysOut >= 60

  // Calculate late fee if within 30 days (matches backend compute.js)
  const lateFee = daysOut <= 30 ? 450 : 0
  const fullPaymentAmount = totalAmount + lateFee

  // Calculate payment amounts for each plan
  const paymentPlans = [
    {
      id: 'full',
      name: daysOut <= 30 ? 'Pay in Full (Late Booking)' : 'Pay in Full',
      icon: DollarSign,
      description: daysOut <= 30
        ? `Complete payment today (includes $${lateFee} late booking fee)`
        : 'Complete payment today',
      amount: fullPaymentAmount,
      dueToday: fullPaymentAmount,
      schedule: null,
      badge: 'Most Popular',
      badgeColor: 'bg-primary-100 text-primary-700',
      available: true,
      features: daysOut <= 30
        ? [
            `Base amount: $${totalAmount.toLocaleString()}`,
            `Late booking fee: $${lateFee}`,
            'Payment plans not available within 30 days',
            'Immediate booking confirmation'
          ]
        : daysOut < 60
        ? [
            'Full payment secures your date',
            'Payment plans require 60+ days notice',
            'Not enough time for installment plans before 60-day cutoff',
            'Immediate booking confirmation'
          ]
        : [
            'Full payment secures your date',
            'No additional charges',
            'Immediate booking confirmation'
          ]
    },
    {
      id: 'deposit500',
      name: '$500 Deposit + Monthly Payments',
      icon: Calendar,
      description: `$500 deposit, then ${monthsUntilCutoff} monthly payments`,
      amount: totalAmount,
      dueToday: 500,
      schedule: Array.from({ length: monthsUntilCutoff }, (_, i) => ({
        amount: Math.round((totalAmount - 500) / monthsUntilCutoff),
        due: `${(i + 1) * 30} days`
      })),
      badge: isDepositAvailable ? 'Flexible' : 'Not Available',
      badgeColor: isDepositAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
      available: isDepositAvailable,
      features: [
        '$500 deposit to secure booking',
        `${monthsUntilCutoff} remaining monthly payments`,
        'All payments complete 60 days before event',
        'No processing fee',
        isDepositAvailable ? 'Available for bookings 60+ days out' : 'Only for bookings 60+ days out'
      ]
    },
    {
      id: 'monthly199',
      name: 'Monthly Payment Plan',
      icon: Clock,
      description: `Fixed $199/month + final balance at 60-day cutoff`,
      amount: totalAmount + 150,
      dueToday: (() => {
        const monthlyPayment = 199
        const processingFee = 150
        return monthlyPayment // $199 first payment (fee added to final payment)
      })(),
      schedule: (() => {
        if (!isMonthlyAvailable) return []

        const monthlyPayment = 199
        const processingFee = 150

        // Calculate how many full months we have until the 60-day cutoff
        const monthsAvailable = Math.max(1, Math.floor(daysUntilCutoff / 30))

        const scheduleArray = []

        // Monthly $199 payments (excluding first payment which is shown in "Due Today")
        for (let i = 1; i < monthsAvailable; i++) {
          scheduleArray.push({
            amount: monthlyPayment,
            due: `${i * 30} days`
          })
        }

        // Calculate final lump sum (includes processing fee)
        const totalMonthlyPayments = monthsAvailable * monthlyPayment
        const finalLumpSum = (totalAmount + processingFee) - totalMonthlyPayments

        // Final lump sum payment at 60-day cutoff (includes $150 processing fee)
        if (finalLumpSum > 0) {
          scheduleArray.push({
            amount: finalLumpSum,
            due: '60 days before event',
            isLumpSum: true
          })
        }

        return scheduleArray
      })(),
      badge: isMonthlyAvailable ? 'Flexible' : 'Not Available',
      badgeColor: isMonthlyAvailable ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500',
      available: isMonthlyAvailable,
      features: (() => {
        const monthlyPayment = 199
        const processingFee = 150

        if (!isMonthlyAvailable) {
          return [
            `Requires at least 30 days before the 60-day cutoff`,
            `Your event is ${daysOut} days away (${daysUntilCutoff} days until cutoff)`,
            'Event too close for monthly payment plan',
            'Choose Pay in Full or $500 Deposit plan instead'
          ]
        }

        // Calculate how many full months we have until the 60-day cutoff
        const monthsAvailable = Math.max(1, Math.floor(daysUntilCutoff / 30))

        // Calculate final lump sum (processing fee baked in, not shown to user)
        const totalMonthlyPayments = monthsAvailable * monthlyPayment
        const finalLumpSum = (totalAmount + processingFee) - totalMonthlyPayments

        const features = []

        // First payment
        features.push(`$${monthlyPayment} due today`)

        // Monthly payments (if any)
        if (monthsAvailable > 1) {
          features.push(`Remaining ${monthsAvailable - 1} monthly payment${monthsAvailable - 1 > 1 ? 's' : ''} of $${monthlyPayment}`)
        }

        // Final lump sum (processing fee baked in, not mentioned to user)
        features.push(`Remaining $${finalLumpSum.toLocaleString()} due 60 days before event`)

        return features
      })()
    }
  ]

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-dusty-900 mb-2">
          Choose Your Payment Plan
        </h3>
        <p className="text-sm text-dusty-600">
          Select the payment option that works best for you
        </p>
      </div>

      <div className="grid gap-4">
        {paymentPlans.map((plan) => {
          const Icon = plan.icon
          const isSelected = selectedPlan === plan.id
          const isDisabled = !plan.available

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => plan.available && onSelectPlan(plan.id)}
              disabled={isDisabled}
              className={clsx(
                'relative w-full text-left p-6 rounded-lg border-2 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isSelected && !isDisabled && 'border-primary-600 bg-primary-50 shadow-md',
                !isSelected && !isDisabled && 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm',
                isDisabled && 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
              )}
            >
              {/* Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={clsx(
                    'p-2 rounded-lg',
                    isSelected && !isDisabled ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-dusty-900">
                      {plan.name}
                    </h4>
                    <p className="text-sm text-dusty-600">
                      {plan.description}
                    </p>
                  </div>
                </div>
                <span className={clsx(
                  'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                  plan.badgeColor
                )}>
                  {plan.badge}
                </span>
              </div>

              {/* Pricing */}
              <div className="mb-4 p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-dusty-600">Due Today</span>
                  <span className="text-2xl font-bold text-dusty-900">
                    ${plan.dueToday.toLocaleString()}
                  </span>
                </div>

                {plan.schedule && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-dusty-500 mb-2">Remaining payments:</p>
                    <div className="space-y-1">
                      {plan.schedule.map((payment, index) => (
                        <div key={index} className="flex justify-between text-xs text-dusty-600">
                          <span>Payment {index + 2} (in {payment.due})</span>
                          <span className="font-medium">${payment.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className={clsx(
                      'w-4 h-4 mr-2 mt-0.5 flex-shrink-0',
                      isDisabled ? 'text-gray-400' : 'text-green-500'
                    )} />
                    <span className="text-sm text-dusty-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Monthly Payment Plan Tip - inside the box */}
              {plan.id === 'monthly199' && isMonthlyAvailable && monthsUntilCutoff < 3 && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-800">
                    <strong>Tip:</strong> With {monthsUntilCutoff} month(s) until the 60-day cutoff, you'll make {monthsUntilCutoff} monthly $199 payments,
                    then pay the remaining balance in one lump sum 60 days before your event.
                  </p>
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && !isDisabled && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Helper text */}
      {daysOut <= 30 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>⚠️ Late Booking Fee:</strong> Your event is {daysOut} days away.
            A $450 late booking fee applies to all bookings within 30 days. Payment plans are not available.
          </p>
        </div>
      )}
      {daysOut > 30 && daysOut < 60 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Your event is {daysOut} days away ({daysUntilCutoff} days until the 60-day payment cutoff).
            This is not enough time for installment payment plans, so only full payment is available.
          </p>
        </div>
      )}
    </div>
  )
}

export default PaymentOptions
