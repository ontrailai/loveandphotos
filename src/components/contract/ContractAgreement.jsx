/**
 * ContractAgreement Component
 * Displays booking summary and contract text with accessibility features
 * Includes jump-to-signature functionality and contract versioning
 */

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Calendar, MapPin, Package, DollarSign, ArrowDown, Printer, Download, Clock } from 'lucide-react'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import { scrollToSignature, formatContractTextForDisplay, estimateReadingTime } from '@utils/contractHelpers'

const ContractAgreement = ({
  bookingData,
  contractText,
  contractVersion,
  className = '',
  onJumpToSignature = scrollToSignature,
  ...props
}) => {
  const [readingTime, setReadingTime] = useState(0)
  const [isSticky, setIsSticky] = useState(false)

  // Calculate reading time
  useEffect(() => {
    if (contractText) {
      setReadingTime(estimateReadingTime(contractText))
    }
  }, [contractText])

  // Handle sticky toolbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById('contract-text')
      if (element) {
        const rect = element.getBoundingClientRect()
        setIsSticky(rect.top < 80 && rect.bottom > 200)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Handle download (save as PDF would require additional implementation)
  const handleDownload = () => {
    // For now, just trigger print dialog which allows save as PDF
    // In a full implementation, you might use a library like jsPDF
    window.print()
  }

  const formattedContractText = formatContractTextForDisplay(contractText)

  return (
    <div className={clsx('w-full max-w-4xl mx-auto', className)} {...props}>
      {/* Booking Summary Card */}
      <div data-testid="booking-summary" className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Date */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-primary-100 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Event Date</h3>
              <p data-testid="summary-event-date" className="text-lg text-gray-700 font-semibold">{bookingData.eventDate}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-sage-100 rounded-lg">
              <MapPin className="w-5 h-5 text-sage-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Location</h3>
              <p data-testid="summary-location" className="text-lg text-gray-700 font-semibold">{bookingData.location}</p>
            </div>
          </div>

          {/* Package */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-dusty-100 rounded-lg">
              <Package className="w-5 h-5 text-dusty-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Package</h3>
              <p data-testid="summary-package" className="text-lg text-gray-700 font-semibold">{bookingData.packageName}</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Total Price</h3>
              <p data-testid="summary-price" className="text-lg text-gray-700 font-semibold">{bookingData.price}</p>
            </div>
          </div>
        </div>

        {/* Jump to Signature Button */}
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            onClick={() => onJumpToSignature()}
            className="inline-flex items-center"
            aria-label="Jump to signature section"
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Jump to Signature
          </Button>
        </div>
      </div>

      {/* Contract Text Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Contract Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">Contract Agreement</h2>
              <Badge variant="primary" size="sm">
                v{contractVersion}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>

        {/* Sticky Toolbar */}
        <div
          className={clsx(
            'sticky top-16 z-10 bg-white border-b border-gray-200 px-6 py-3 transition-all duration-200',
            isSticky ? 'shadow-md' : 'shadow-none'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Reading Contract</span>
              <Badge variant="outline" size="sm">
                v{contractVersion}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onJumpToSignature()}
                aria-label="Jump to signature"
              >
                <ArrowDown className="w-4 h-4 mr-1" />
                Jump to Signature
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                aria-label="Print contract"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                aria-label="Save as PDF"
              >
                <Download className="w-4 h-4 mr-1" />
                Save PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Contract Text */}
        <div
          id="contract-text"
          data-testid="contract-text"
          className="px-6 py-8 max-h-96 overflow-y-auto"
          role="region"
          aria-label="Contract Terms"
        >
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
              {formattedContractText}
            </pre>
          </div>
        </div>

        {/* Contract Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>You're viewing contract version <strong>{contractVersion}</strong></p>
              <p className="mt-1">Please read all terms carefully before signing.</p>
            </div>
            <Button
              type="button"
              onClick={() => onJumpToSignature()}
              aria-label="Proceed to signature"
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Proceed to Signature
            </Button>
          </div>
        </div>
      </div>

      {/* Legal Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm font-bold">!</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Legal Notice</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This is a legally binding contract. Please read all terms and conditions carefully.
              If you have questions, contact us before signing. Your digital signature will have
              the same legal effect as a handwritten signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractAgreement