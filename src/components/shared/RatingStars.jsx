/**
 * RatingStars Component
 * Display rating with stars
 */

import { StarIcon } from 'lucide-react'
import { clsx } from 'clsx'

const RatingStars = ({ 
  rating = 0, 
  maxRating = 5, 
  size = 'md',
  showNumber = false,
  interactive = false,
  onRatingChange,
  className = ''
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const handleClick = (index) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1)
    }
  }

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {[...Array(maxRating)].map((_, index) => {
        const filled = index < Math.floor(rating)
        const halfFilled = index === Math.floor(rating) && rating % 1 !== 0
        
        return (
          <button
            key={index}
            onClick={() => handleClick(index)}
            disabled={!interactive}
            className={clsx(
              'relative',
              { 'cursor-pointer hover:scale-110 transition-transform': interactive }
            )}
          >
            <StarIcon
              className={clsx(
                sizes[size],
                'transition-colors',
                filled || halfFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              )}
            />
            {halfFilled && (
              <StarIcon
                className={clsx(
                  sizes[size],
                  'absolute inset-0 text-yellow-400 fill-yellow-400',
                  'clip-half'
                )}
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
          </button>
        )
      })}
      {showNumber && (
        <span className="ml-2 text-sm font-medium text-dusty-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default RatingStars
