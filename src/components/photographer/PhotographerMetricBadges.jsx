import React from 'react';
import { TrendingUp, Info } from 'lucide-react';
import Badge from '@/components/ui/Badge';

/**
 * PhotographerMetricBadges Component
 *
 * Displays photographer performance metrics as badges:
 * - Acceptance rate (if available)
 * - Shows "Not enough data" message if insufficient data points
 */
const PhotographerMetricBadges = ({ photographer, className = '', size = 'default' }) => {
  if (!photographer) return null;

  // Extract metrics with fallback to manual overrides
  const acceptanceRate = photographer.manual_override_acceptance_rate ?? photographer.acceptance_rate;
  const hasMinimumData = photographer.has_minimum_data ?? false;

  // If no minimum data and no manual overrides, show info message
  if (!hasMinimumData && !acceptanceRate) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Info className="w-4 h-4" />
        <span className="text-sm">New photographer - metrics coming soon</span>
      </div>
    );
  }

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5 gap-1',
    default: 'text-sm px-3 py-1 gap-1.5',
    large: 'text-base px-4 py-1.5 gap-2'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Acceptance Rate Badge */}
      {acceptanceRate !== null && acceptanceRate !== undefined && (
        <div
          className={`
            inline-flex items-center
            ${acceptanceRate >= 80 ? 'bg-blue-100 text-blue-800' :
              acceptanceRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'}
            rounded-full font-medium
            ${sizeClasses[size]}
          `}
          role="status"
          aria-label={`Accepts ${Math.round(acceptanceRate)}% of booking requests`}
        >
          <TrendingUp className={iconSizes[size]} />
          <span>Accepts {Math.round(acceptanceRate)}% of bookings</span>
        </div>
      )}

      {/* Manual Override Indicator (for admins) */}
      {photographer.manual_override_acceptance_rate && (
        <div
          className="text-xs text-muted-foreground italic"
          title="Manually set by admin"
        >
          (admin override)
        </div>
      )}
    </div>
  );
};

export default PhotographerMetricBadges;