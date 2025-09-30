/**
 * Step 2: Modification Form
 * Form to specify hours and add-ons changes
 */

import { useState } from 'react'
import Button from '@components/ui/Button'
import { PlusIcon, MinusIcon } from 'lucide-react'

const AVAILABLE_ADDONS = [
  { id: 'second_shooter', name: 'Second Shooter', description: 'Additional photographer for comprehensive coverage' },
  { id: 'raw_files', name: 'RAW Files', description: 'Unedited high-resolution photo files' },
  { id: 'rush_delivery', name: 'Rush Delivery', description: '2-week delivery instead of standard 4-6 weeks' }
]

const ModificationFormStep = ({ booking, onNext, onBack, loading }) => {
  const [hoursToAdd, setHoursToAdd] = useState(0)
  const [selectedAddOns, setSelectedAddOns] = useState([])

  // Get current add-ons from booking
  const currentAddOns = booking.personalization_data?.addons || []

  const handleAddOnToggle = (addonId) => {
    const isCurrentlySelected = currentAddOns.includes(addonId)
    const isToggledOn = selectedAddOns.some(a => a.id === addonId && a.action === 'add')
    const isToggledOff = selectedAddOns.some(a => a.id === addonId && a.action === 'remove')

    let newSelectedAddOns = [...selectedAddOns]

    if (isCurrentlySelected) {
      // Currently has add-on
      if (isToggledOff) {
        // Remove toggle-off (cancel removal)
        newSelectedAddOns = newSelectedAddOns.filter(a => a.id !== addonId)
      } else {
        // Toggle off (remove add-on)
        newSelectedAddOns = newSelectedAddOns.filter(a => a.id !== addonId)
        newSelectedAddOns.push({ id: addonId, action: 'remove' })
      }
    } else {
      // Doesn't have add-on
      if (isToggledOn) {
        // Remove toggle-on (cancel addition)
        newSelectedAddOns = newSelectedAddOns.filter(a => a.id !== addonId)
      } else {
        // Toggle on (add add-on)
        newSelectedAddOns = newSelectedAddOns.filter(a => a.id !== addonId)
        newSelectedAddOns.push({ id: addonId, action: 'add' })
      }
    }

    setSelectedAddOns(newSelectedAddOns)
  }

  const getAddOnStatus = (addonId) => {
    const isCurrentlySelected = currentAddOns.includes(addonId)
    const toggledState = selectedAddOns.find(a => a.id === addonId)

    if (toggledState) {
      if (toggledState.action === 'add') return 'adding'
      if (toggledState.action === 'remove') return 'removing'
    }

    return isCurrentlySelected ? 'current' : 'available'
  }

  const handleSubmit = () => {
    if (hoursToAdd === 0 && selectedAddOns.length === 0) {
      return // No changes
    }

    const addOnsToAdd = selectedAddOns.filter(a => a.action === 'add').map(a => a.id)
    const addOnsToRemove = selectedAddOns.filter(a => a.action === 'remove').map(a => a.id)

    onNext({
      hoursToAdd,
      addOnsToAdd,
      addOnsToRemove
    })
  }

  const hasChanges = hoursToAdd > 0 || selectedAddOns.length > 0

  return (
    <div className="space-y-6">
      {/* Hours Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Add Extra Hours</h3>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHoursToAdd(Math.max(0, hoursToAdd - 1))}
            disabled={hoursToAdd === 0}
          >
            <MinusIcon className="w-4 h-4" />
          </Button>

          <div className="text-center min-w-[100px]">
            <p className="text-3xl font-bold text-foreground">{hoursToAdd}</p>
            <p className="text-sm text-muted-foreground">hour{hoursToAdd !== 1 ? 's' : ''}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setHoursToAdd(hoursToAdd + 1)}
            disabled={hoursToAdd >= 10}
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>

        {hoursToAdd > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Adding {hoursToAdd} extra hour{hoursToAdd !== 1 ? 's' : ''} of coverage
          </p>
        )}
      </div>

      {/* Add-Ons Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Modify Add-Ons</h3>

        <div className="space-y-3">
          {AVAILABLE_ADDONS.map(addon => {
            const status = getAddOnStatus(addon.id)

            return (
              <div
                key={addon.id}
                onClick={() => handleAddOnToggle(addon.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-colors
                  ${status === 'adding'
                    ? 'border-green-500 bg-green-50'
                    : status === 'removing'
                      ? 'border-red-500 bg-red-50'
                      : status === 'current'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-foreground">{addon.name}</p>
                      {status === 'current' && (
                        <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
                          Current
                        </span>
                      )}
                      {status === 'adding' && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          + Adding
                        </span>
                      )}
                      {status === 'removing' && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          - Removing
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || loading}
          loading={loading}
        >
          Calculate Price
        </Button>
      </div>
    </div>
  )
}

export default ModificationFormStep