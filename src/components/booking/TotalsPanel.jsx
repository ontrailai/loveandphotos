/**
 * TotalsPanel Component
 * Magic UI enhanced totals sidebar with live-updating line items
 * Responsive design with sticky positioning and smooth transitions
 */

import { useState, useEffect } from 'react'
import { XIcon, ShoppingCartIcon } from 'lucide-react'
import { clsx } from 'clsx'
import Button from '@components/ui/Button'

const TotalsPanel = ({
  selectedAddons = [],
  packagePrice = 0,
  packageTitle = 'Package',
  onRemoveAddon,
  onContinue,
  onSkip,
  className = '',
  isSticky = true,
  position = 'right', // 'right', 'bottom'
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [previousTotal, setPreviousTotal] = useState(0)

  // Calculate totals
  const addonsTotal = selectedAddons.reduce((sum, addon) => {
    return sum + (addon.price * (addon.qty || 1))
  }, 0)
  const grandTotal = packagePrice + addonsTotal

  // Track total changes for screen reader announcements
  useEffect(() => {
    if (grandTotal !== previousTotal) {
      setPreviousTotal(grandTotal)
    }
  }, [grandTotal, previousTotal])

  // Show/hide panel based on selections
  useEffect(() => {
    setIsVisible(selectedAddons.length > 0 || packagePrice > 0)
  }, [selectedAddons.length, packagePrice])

  const handleRemoveAddon = (addonId) => {
    if (onRemoveAddon) {
      onRemoveAddon(addonId)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Mobile bottom sheet styles - Magic UI enhanced
  const bottomSheetStyles = clsx(
    'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg shadow-primary/10 z-40',
    'transform transition-all duration-300 ease-in-out',
    {
      'translate-y-0': isVisible,
      'translate-y-full': !isVisible,
    }
  )

  // Desktop sidebar styles - Magic UI enhanced
  const sidebarStyles = clsx(
    'bg-white border border-gray-200 rounded-xl shadow-lg shadow-primary/10',
    'transition-all duration-300',
    {
      'sticky top-8': isSticky,
    }
  )

  // Common content
  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <ShoppingCartIcon className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Order Summary
        </h3>
      </div>

      {/* Package line item */}
      {packagePrice > 0 && (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">{packageTitle}</p>
              <p className="text-sm text-gray-500">Base package</p>
            </div>
            <span className="font-semibold text-gray-900">
              {formatPrice(packagePrice)}
            </span>
          </div>
        </div>
      )}

      {/* Add-ons section */}
      {selectedAddons.length > 0 && (
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            Add-Ons ({selectedAddons.length})
          </h4>

          {selectedAddons.map((addon) => (
            <div
              key={addon.id}
              className="flex justify-between items-start space-x-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {addon.title}
                </p>
                {addon.qty && addon.qty > 1 && (
                  <p className="text-xs text-gray-500">
                    Qty: {addon.qty}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {formatPrice(addon.price * (addon.qty || 1))}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveAddon(addon.id)}
                  className={clsx(
                    'p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md',
                    'hover:scale-105 active:scale-95'
                  )}
                  aria-label={`Remove ${addon.title} from order`}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals section */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        {/* Subtotal (if there are add-ons) */}
        {selectedAddons.length > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Package</span>
              <span className="text-gray-900">{formatPrice(packagePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Add-ons</span>
              <span className="text-gray-900">{formatPrice(addonsTotal)}</span>
            </div>
          </>
        )}

        {/* Grand total */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span
            className="text-xl font-bold text-gray-900"
            aria-live="polite"
            aria-label={`Total price: ${formatPrice(grandTotal)}`}
          >
            {formatPrice(grandTotal)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col space-y-2 mt-6">
        <Button
          size="lg"
          onClick={onContinue}
          className="w-full"
          disabled={!packagePrice}
        >
          Continue to Review
        </Button>

        {selectedAddons.length === 0 && onSkip && (
          <Button
            variant="outline"
            size="lg"
            onClick={onSkip}
            className="w-full"
          >
            Skip Add-Ons
          </Button>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500 text-center mt-4">
        You can modify your selection before finalizing
      </p>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedAddons.length === 0
          ? 'No add-ons selected'
          : `${selectedAddons.length} add-on${selectedAddons.length !== 1 ? 's' : ''} selected. Total: ${formatPrice(grandTotal)}`
        }
      </div>
    </>
  )

  // Render nothing if not visible and no package
  if (!isVisible && packagePrice <= 0) {
    return null
  }

  // Mobile bottom sheet layout
  if (position === 'bottom') {
    return (
      <div className={bottomSheetStyles}>
        <div className="p-4 max-h-96 overflow-y-auto">
          {panelContent}
        </div>
      </div>
    )
  }

  // Desktop sidebar layout
  return (
    <div className={clsx(sidebarStyles, className)} {...props}>
      <div className="p-6">
        {panelContent}
      </div>
    </div>
  )
}

export default TotalsPanel