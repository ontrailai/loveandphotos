/**
 * AddOnsGrid Component
 * Magic UI responsive grid layout for add-on cards with equal heights
 * Enhanced with validation, state management, and accessibility features
 */

import { useState, useEffect, useMemo } from 'react'
import { clsx } from 'clsx'
import AddOnCard from './AddOnCard'
import { ADD_ONS_CONFIG, getFormattedAddOn } from '@/data/addOnsConfig'
import {
  validateRushDelivery,
  validateSecondShooter,
  validateAddOnSelections
} from '@utils/addOnPricing'

const AddOnsGrid = ({
  selectedAddons = [],
  onSelectionChange,
  onInfoClick = null,
  context = {}, // Package context for pricing and validation
  className = '',
  photographerId, // Destructure to prevent DOM warning
  packageContext, // Destructure to prevent DOM warning
  ...props
}) => {
  const [validationResults, setValidationResults] = useState({})

  // Format add-ons with context-aware pricing
  const formattedAddons = useMemo(() => {
    return ADD_ONS_CONFIG.map(addon => getFormattedAddOn(addon.id, context))
  }, [context])

  // Validate selections whenever they change
  useEffect(() => {
    const validation = validateAddOnSelections(selectedAddons, context)
    setValidationResults(prevResults => {
      // Only update if validation actually changed to prevent infinite loops
      const hasChanged = JSON.stringify(prevResults) !== JSON.stringify(validation)
      return hasChanged ? validation : prevResults
    })
  }, [selectedAddons, context])

  // Check if an add-on is selected
  const isSelected = (addonId) => {
    return selectedAddons.some(addon => addon.id === addonId)
  }

  // Get validation state for a specific add-on
  const getAddonValidation = (addonId) => {
    const addon = ADD_ONS_CONFIG.find(a => a.id === addonId)
    if (!addon) return { isValid: true }

    let validationError = null
    let validationWarning = null
    let isDisabled = false

    // Check for errors from validation results
    const error = validationResults.errors?.find(err => err.addonId === addonId)
    if (error) {
      validationError = error.message
      isDisabled = true
    }

    // Check for warnings
    const warning = validationResults.warnings?.find(warn => warn.addonId === addonId)
    if (warning) {
      validationWarning = warning.message
    }

    // Specific validation checks
    if (addonId === 'rush-delivery' && context.selectedDate) {
      const rushValidation = validateRushDelivery(context.selectedDate)
      if (!rushValidation.isValid) {
        validationError = rushValidation.reason
        isDisabled = true
      }
    }

    if (addonId === 'second-shooter' && context.hoursBooked) {
      const shooterValidation = validateSecondShooter(context.hoursBooked)
      if (!shooterValidation.isValid) {
        validationError = shooterValidation.error
        isDisabled = true
      }
    }

    // Engagement session warning
    if (addonId === 'engagement-session' && context.selectedDate) {
      const eventDate = new Date(context.selectedDate)
      const now = new Date()
      const thirtyOneDaysFromNow = new Date(now.getTime() + (31 * 24 * 60 * 60 * 1000))

      if (eventDate <= thirtyOneDaysFromNow) {
        validationWarning = 'If your session is within 31 days, please contact us before booking.'
      }
    }

    return {
      isValid: !validationError,
      validationError,
      validationWarning,
      isDisabled
    }
  }

  // Handle add-on toggle
  const handleAddonToggle = (addon, shouldSelect) => {
    if (!onSelectionChange) return

    let newSelections = [...selectedAddons]

    if (shouldSelect) {
      // Add to selection if not already selected
      if (!isSelected(addon.id)) {
        newSelections.push({
          id: addon.id,
          title: addon.title,
          price: addon.displayPrice || addon.basePrice,
          qty: 1
        })
      }
    } else {
      // Remove from selection
      newSelections = newSelections.filter(selected => selected.id !== addon.id)
    }

    onSelectionChange(newSelections)
  }

  // Handle info click
  const handleInfoClick = (addon) => {
    if (onInfoClick) {
      onInfoClick(addon)
    }
  }

  return (
    <div
      role="group"
      aria-label="Available add-ons"
      className={clsx(
        // Magic UI responsive grid with equal heights
        'grid gap-6',
        'grid-cols-1',           // Mobile: 1 column
        'md:grid-cols-2',        // Tablet: 2 columns
        'lg:grid-cols-3',        // Desktop: 3 columns (optimal for add-ons)
        'auto-rows-fr',          // Equal height rows
        className
      )}
      {...props}
    >
      {formattedAddons.map((addon) => {
        const validation = getAddonValidation(addon.id)

        return (
          <AddOnCard
            key={addon.id}
            addon={addon}
            isSelected={isSelected(addon.id)}
            isDisabled={validation.isDisabled}
            onToggle={handleAddonToggle}
            onInfoClick={handleInfoClick}
            validationError={validation.validationError}
            validationWarning={validation.validationWarning}
            context={context}
            className="h-full" // Magic UI equal height with flex layout
          />
        )
      })}

      {/* Overall validation summary (screen reader only) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {validationResults.errors?.length > 0 && (
          <div role="alert">
            {validationResults.errors.length} add-on{validationResults.errors.length !== 1 ? 's have' : ' has'} validation errors.
          </div>
        )}

        {validationResults.warnings?.length > 0 && (
          <div>
            {validationResults.warnings.length} add-on{validationResults.warnings.length !== 1 ? 's have' : ' has'} important notices.
          </div>
        )}
      </div>
    </div>
  )
}

export default AddOnsGrid