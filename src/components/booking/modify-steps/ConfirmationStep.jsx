/**
 * Step 5: Confirmation
 * Success message after payment completion
 */

import Button from '@components/ui/Button'
import { CheckCircleIcon } from 'lucide-react'

const ConfirmationStep = ({ booking, amendment, preview, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="text-center space-y-6 py-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Modification Complete!
        </h2>
        <p className="text-muted-foreground">
          Your booking has been successfully updated
        </p>
      </div>

      {/* Payment Confirmation */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-green-900 mb-2">Payment Confirmed</p>
        <p className="text-2xl font-bold text-green-900">
          {formatCurrency(preview.totalAmount)}
        </p>
        <p className="text-xs text-green-700 mt-1">
          Payment ID: {amendment.stripePaymentIntentId?.substring(0, 20)}...
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
        <h4 className="font-semibold text-blue-900 mb-2">What's Next:</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Your photographer has been notified of the changes</li>
          <li>• An updated contract will be available in your dashboard</li>
          <li>• You'll receive a confirmation email shortly</li>
          <li>• Your new booking total is {formatCurrency((booking.total_amount || 0) + preview.totalAmount)}</li>
        </ul>
      </div>

      {/* Close Button */}
      <Button onClick={onClose} size="lg">
        Return to Dashboard
      </Button>
    </div>
  )
}

export default ConfirmationStep