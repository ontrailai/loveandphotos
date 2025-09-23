import React from 'react';
import { Clock, TrendingUp, Info } from 'lucide-react';
import Badge from '@/components/ui/Badge';

/**
 * PhotographerMetricBadges Component
 * 
 * Displays photographer performance metrics as badges:
 * - Response time (if available)
 * - Acceptance rate (if available)
 * - Shows "Not enough data" message if insufficient data points
 */
const PhotographerMetricBadges = ({ photographer, className = '', size = 'default' }) => {
  if (!photographer) return null;

  // Extract metrics with fallback to manual overrides
  const acceptanceRate = photographer.manual_override_acceptance_rate ?? photographer.acceptance_rate;
  const responseTimeMinutes = photographer.manual_override_response_time ?? photographer.avg_response_time_minutes;
  const hasMinimumData = photographer.has_minimum_data ?? false;

  // Convert minutes to hours/days for better readability
  const formatResponseTime = (minutes) => {
    if (!minutes || minutes < 0) return null;
    
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.round(minutes / 60);
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
      const days = Math.round(minutes / 1440);
      return `${days} day${days === 1 ? '' : 's'}`;
    }
  };

  // If no minimum data and no manual overrides, show info message
  if (!hasMinimumData && !acceptanceRate && !responseTimeMinutes) {
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
      {/* Response Time Badge */}
      {responseTimeMinutes !== null && responseTimeMinutes !== undefined && (
        <div 
          className={`
            inline-flex items-center
            bg-green-100 text-green-800 
            rounded-full font-medium
            ${sizeClasses[size]}
          `}
          role="status"
          aria-label={`Typically responds in ${formatResponseTime(responseTimeMinutes)}`}
        >
          <Clock className={iconSizes[size]} />
          <span>Responds in {formatResponseTime(responseTimeMinutes)}</span>
        </div>
      )}

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
      {(photographer.manual_override_acceptance_rate || photographer.manual_override_response_time) && (
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