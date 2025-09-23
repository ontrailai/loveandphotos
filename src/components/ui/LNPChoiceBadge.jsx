import { Star, Award } from 'lucide-react'
import { useState } from 'react'

const LNPChoiceBadge = ({ 
  size = 'default', 
  showTooltip = true,
  className = ''
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    default: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2'
  }

  const iconSize = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5'
  }

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      <div 
        className={`
          inline-flex items-center gap-1.5 
          bg-gradient-to-r from-primary-500 to-primary-600 
          text-white font-medium rounded-full 
          shadow-lg shadow-primary-500/25
          ${sizeClasses[size]}
          ${className}
        `}
        role="status"
        aria-label="Love & Photo's Choice - Hand-selected by our team for quality, consistency, and experience"
      >
        <Award className={iconSize[size]} aria-hidden="true" />
        <span>Love & Photo's Choice</span>
      </div>

      {/* Tooltip */}
      {showTooltip && isTooltipVisible && (
        <div 
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50
                     bg-gray-900 text-white text-xs rounded-lg py-2 px-3
                     whitespace-nowrap shadow-xl pointer-events-none
                     animate-fadeIn"
        >
          <div className="max-w-xs">
            Hand-selected by our team for quality, consistency, and experience.
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 
                          border-l-transparent border-r-transparent border-t-gray-900">
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LNPChoiceBadge

/*
 * Future Automation Logic:
 * ------------------------
 * This badge can be automatically assigned based on:
 * 
 * 1. Pay Tier: Gold (3) or Platinum (4) tier photographers
 * 2. Performance Metrics:
 *    - average_rating >= 4.5
 *    - total_reviews >= 10
 *    - booking_acceptance_rate >= 0.85
 *    - cancellation_rate < 0.05
 * 3. Professional Status:
 *    - onboarding_completed = true
 *    - is_verified = true
 *    - completed_jobs_count >= 20
 * 4. Engagement:
 *    - response_time_hours <= 4
 *    - Active within last 30 days
 * 
 * Implementation Example:
 * ```sql
 * UPDATE photographers 
 * SET is_lnp_choice = (
 *   pay_tier_id >= 3 AND
 *   average_rating >= 4.5 AND
 *   total_reviews >= 10 AND
 *   booking_acceptance_rate >= 0.85 AND
 *   cancellation_rate < 0.05 AND
 *   onboarding_completed = true AND
 *   is_verified = true AND
 *   completed_jobs_count >= 20 AND
 *   response_time_hours <= 4
 * );
 * ```
 * 
 * This could be run as a scheduled job (e.g., weekly) to automatically
 * update the LNP Choice status based on current performance.
 */