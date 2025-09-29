/**
 * BookingStepper Component
 * Progress indicator for multi-step booking flow
 * Accessible, responsive, keyboard-navigable stepper
 */

import { CheckCircleIcon, CircleIcon } from 'lucide-react'
import { clsx } from 'clsx'

const BookingStepper = ({
  steps = [],
  currentStepIndex = 0,
  onStepClick = null,
  className = ''
}) => {
  const handleStepClick = (stepIndex, step) => {
    // Only allow clicking on completed steps if callback provided
    if (onStepClick && step.status === 'completed') {
      onStepClick(stepIndex, step)
    }
  }

  const handleStepKeyDown = (event, stepIndex, step) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleStepClick(stepIndex, step)
    }
  }

  return (
    <nav
      className={clsx('w-full bg-white border-b border-gray-200 px-4 py-6', className)}
      aria-label="Booking progress"
    >
      <div className="max-w-4xl mx-auto">
        {/* Desktop: Horizontal Layout */}
        <ol className="hidden md:flex items-center justify-between space-x-8">
          {steps.map((step, index) => (
            <li
              key={step.id || index}
              className="flex-1 flex items-center"
            >
              {/* Step Circle and Content */}
              <div className="flex items-center">
                <button
                  onClick={() => handleStepClick(index, step)}
                  onKeyDown={(e) => handleStepKeyDown(e, index, step)}
                  disabled={step.status !== 'completed' || !onStepClick}
                  className={clsx(
                    'flex items-center space-x-3 transition-colors duration-200',
                    {
                      'cursor-pointer hover:text-primary-600': step.status === 'completed' && onStepClick,
                      'cursor-default': step.status !== 'completed' || !onStepClick,
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1': onStepClick
                    }
                  )}
                  aria-current={index === currentStepIndex ? 'step' : undefined}
                  aria-label={`${step.label}${step.status === 'completed' ? ' (completed)' : step.status === 'current' ? ' (current step)' : ' (upcoming)'}`}
                >
                  {/* Step Icon */}
                  <div
                    className={clsx(
                      'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-200',
                      {
                        // Completed step
                        'bg-green-500 border-green-500 text-white': step.status === 'completed',
                        // Current step
                        'bg-primary-500 border-primary-500 text-white': step.status === 'current',
                        // Upcoming step
                        'bg-gray-100 border-gray-300 text-gray-400': step.status === 'upcoming'
                      }
                    )}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : step.status === 'current' ? (
                      <span className="w-3 h-3 rounded-full bg-white" />
                    ) : (
                      <CircleIcon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={clsx(
                      'text-sm font-medium transition-colors duration-200',
                      {
                        'text-green-600': step.status === 'completed',
                        'text-primary-600': step.status === 'current',
                        'text-gray-500': step.status === 'upcoming'
                      }
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 ml-4 transition-colors duration-200',
                    {
                      'bg-green-500': step.status === 'completed',
                      'bg-gray-300': step.status !== 'completed'
                    }
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>

        {/* Mobile: Vertical Layout */}
        <ol className="md:hidden space-y-4">
          {steps.map((step, index) => (
            <li key={step.id || index}>
              <button
                onClick={() => handleStepClick(index, step)}
                onKeyDown={(e) => handleStepKeyDown(e, index, step)}
                disabled={step.status !== 'completed' || !onStepClick}
                className={clsx(
                  'w-full flex items-center space-x-3 text-left p-2 rounded-lg transition-colors duration-200',
                  {
                    'cursor-pointer hover:bg-gray-50': step.status === 'completed' && onStepClick,
                    'cursor-default': step.status !== 'completed' || !onStepClick,
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2': onStepClick
                  }
                )}
                aria-current={index === currentStepIndex ? 'step' : undefined}
                aria-label={`${step.label}${step.status === 'completed' ? ' (completed)' : step.status === 'current' ? ' (current step)' : ' (upcoming)'}`}
              >
                {/* Step Icon */}
                <div
                  className={clsx(
                    'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-200',
                    {
                      'bg-green-500 border-green-500 text-white': step.status === 'completed',
                      'bg-primary-500 border-primary-500 text-white': step.status === 'current',
                      'bg-gray-100 border-gray-300 text-gray-400': step.status === 'upcoming'
                    }
                  )}
                >
                  {step.status === 'completed' ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : step.status === 'current' ? (
                    <span className="w-3 h-3 rounded-full bg-white" />
                  ) : (
                    <CircleIcon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  {/* Step Label */}
                  <div
                    className={clsx(
                      'text-sm font-medium transition-colors duration-200',
                      {
                        'text-green-600': step.status === 'completed',
                        'text-primary-600': step.status === 'current',
                        'text-gray-500': step.status === 'upcoming'
                      }
                    )}
                  >
                    {step.label}
                  </div>

                  {/* Step Description (mobile only) */}
                  {step.description && (
                    <div className="text-xs text-gray-400 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>

                {/* Connector Line (mobile) */}
                {index < steps.length - 1 && (
                  <div
                    className={clsx(
                      'absolute left-6 top-12 w-0.5 h-4 transition-colors duration-200',
                      {
                        'bg-green-500': step.status === 'completed',
                        'bg-gray-300': step.status !== 'completed'
                      }
                    )}
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}

export default BookingStepper