/**
 * Step 3: Price Preview
 * Display calculated price breakdown before payment
 */

import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'

const PricePreviewStep = ({ booking, preview, modifications, onNext, onBack }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatAddOnName = (id) => {
    return id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Payment Tier Notice */}
      <div className={`border rounded-lg p-4 ${
        preview.paymentTier === 'late' ? 'bg-red-50 border-red-200' :
        preview.paymentTier === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
        'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">
              {preview.paymentTier === 'late' && 'Late Modification'}
              {preview.paymentTier === 'moderate' && 'Moderate Timeline'}
              {preview.paymentTier === 'flexible' && 'Flexible Modification'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {preview.daysUntilEvent} days until event
            </p>
          </div>
          <Badge
            variant={preview.paymentTier === 'late' ? 'danger' : preview.paymentTier === 'moderate' ? 'warning' : 'success'}
          >
            {preview.paymentTier === 'late' && 'Full + Late Fee'}
            {preview.paymentTier === 'moderate' && 'Full Payment'}
            {preview.paymentTier === 'flexible' && 'Flexible'}
          </Badge>
        </div>
      </div>

      {/* Price Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Price Breakdown</h3>

        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          {/* Hours Added */}
          {preview.breakdown.hours.quantity > 0 && (
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">
                  Additional Hours ({preview.breakdown.hours.quantity}h)
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(preview.breakdown.hours.rate)}/hour
                </p>
              </div>
              <p className="font-semibold text-foreground">
                {formatCurrency(preview.breakdown.hours.subtotal)}
              </p>
            </div>
          )}

          {/* Add-Ons Added */}
          {preview.breakdown.addOns.added.length > 0 && (
            <div className="space-y-2 pb-3 border-b border-border">
              <p className="font-medium text-green-700">Add-Ons Added:</p>
              {preview.breakdown.addOns.added.map(addon => (
                <div key={addon} className="flex justify-between items-center pl-4">
                  <p className="text-sm text-foreground">+ {formatAddOnName(addon)}</p>
                  <p className="text-sm font-semibold text-green-700">
                    +{formatCurrency(booking.photographers?.addon_prices?.[addon] || 0)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add-Ons Removed */}
          {preview.breakdown.addOns.removed.length > 0 && (
            <div className="space-y-2 pb-3 border-b border-border">
              <p className="font-medium text-red-700">Add-Ons Removed:</p>
              {preview.breakdown.addOns.removed.map(addon => (
                <div key={addon} className="flex justify-between items-center pl-4">
                  <p className="text-sm text-foreground">- {formatAddOnName(addon)}</p>
                  <p className="text-sm font-semibold text-red-700">
                    -{formatCurrency(booking.photographers?.addon_prices?.[addon] || 0)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Late Fee */}
          {preview.breakdown.fees.lateFee > 0 && (
            <div className="flex justify-between items-center pb-3 border-b border-border bg-red-50 -mx-4 px-4 py-2">
              <div>
                <p className="font-medium text-red-900">Late Modification Fee</p>
                <p className="text-xs text-red-700">{preview.breakdown.fees.reason}</p>
              </div>
              <p className="font-semibold text-red-900">
                {formatCurrency(preview.breakdown.fees.lateFee)}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-3">
            <p className="text-lg font-bold text-foreground">Total Due Today</p>
            <p className="text-2xl font-bold text-primary-600">
              {formatCurrency(preview.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* New Booking Total */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-900">New Booking Total</span>
          <span className="text-xl font-bold text-blue-900">
            {formatCurrency((booking.total_amount || 0) + preview.totalAmount)}
          </span>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Previous: {formatCurrency(booking.total_amount || 0)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Proceed to Payment
        </Button>
      </div>
    </div>
  )
}

export default PricePreviewStep