import { useState } from 'react'
import PropTypes from 'prop-types'

/**
 * GearChecklistSection Component
 *
 * Displays a checklist of professional videography gear for videographers
 * to indicate which equipment they own or regularly use.
 *
 * This component replaces portfolio upload functionality for videographers.
 */
const GearChecklistSection = ({ gearData, onGearChange, readOnly = false }) => {
  const [localGearData, setLocalGearData] = useState(gearData || {
    gear_has_camera: false,
    gear_has_lenses: false,
    gear_has_tripod: false,
    gear_has_gimbal: false,
    gear_has_drone: false,
    gear_has_audio_recorder: false,
    gear_has_lighting: false
  })

  const gearItems = [
    {
      id: 'gear_has_camera',
      label: 'Camera(s)',
      icon: '📷',
      description: 'Professional camera equipment'
    },
    {
      id: 'gear_has_lenses',
      label: 'Lenses',
      icon: '🔍',
      description: 'Professional lenses'
    },
    {
      id: 'gear_has_tripod',
      label: 'Tripod',
      icon: '🦵',
      description: 'Camera stabilization tripod'
    },
    {
      id: 'gear_has_gimbal',
      label: 'Gimbal',
      icon: '🤸',
      description: 'Gimbal/stabilizer for smooth video'
    },
    {
      id: 'gear_has_drone',
      label: 'Drone',
      icon: '🚁',
      description: 'Aerial videography drone'
    },
    {
      id: 'gear_has_audio_recorder',
      label: 'Audio Recorder',
      icon: '🎙️',
      description: 'Professional audio equipment'
    },
    {
      id: 'gear_has_lighting',
      label: 'Lighting Gear',
      icon: '💡',
      description: 'Professional lighting equipment'
    }
  ]

  const handleCheckboxChange = (gearId) => {
    if (readOnly) return

    const newGearData = {
      ...localGearData,
      [gearId]: !localGearData[gearId]
    }
    setLocalGearData(newGearData)

    if (onGearChange) {
      onGearChange(newGearData)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-rose-100 pb-3">
        <h3 className="text-lg font-semibold text-rose-900">Equipment</h3>
        <p className="text-sm text-rose-600 mt-1">
          Select the professional gear you own or regularly use for videography
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {gearItems.map((item) => (
          <label
            key={item.id}
            className={`
              flex items-start gap-3 p-4 rounded-lg border-2 transition-all
              ${localGearData[item.id]
                ? 'border-rose-400 bg-rose-50'
                : 'border-gray-200 bg-white hover:border-rose-200'
              }
              ${readOnly ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <input
              type="checkbox"
              checked={localGearData[item.id] || false}
              onChange={() => handleCheckboxChange(item.id)}
              disabled={readOnly}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 disabled:cursor-not-allowed"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl" role="img" aria-label={item.label}>
                  {item.icon}
                </span>
                <span className="font-medium text-gray-900">{item.label}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </div>
          </label>
        ))}
      </div>

      {!readOnly && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
          <p className="text-sm text-rose-700">
            <strong>Note:</strong> Your selected equipment will be displayed on your public profile to help clients understand your capabilities.
          </p>
        </div>
      )}
    </div>
  )
}

GearChecklistSection.propTypes = {
  gearData: PropTypes.shape({
    gear_has_camera: PropTypes.bool,
    gear_has_lenses: PropTypes.bool,
    gear_has_tripod: PropTypes.bool,
    gear_has_gimbal: PropTypes.bool,
    gear_has_drone: PropTypes.bool,
    gear_has_audio_recorder: PropTypes.bool,
    gear_has_lighting: PropTypes.bool
  }),
  onGearChange: PropTypes.func,
  readOnly: PropTypes.bool
}

export default GearChecklistSection
