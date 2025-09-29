/**
 * Card Component
 * Versatile card container with hover effects
 */

import { clsx } from 'clsx'

const Card = ({
  children,
  className = '',
  hover = false,
  padding = true,
  onClick,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-card rounded-xl shadow-sm border border-border text-card-foreground',
        {
          'hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer': hover,
          'p-6': padding,
        },
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

const CardContent = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('', className)} {...props}>
      {children}
    </div>
  )
}

export { Card, CardContent }
export default Card
