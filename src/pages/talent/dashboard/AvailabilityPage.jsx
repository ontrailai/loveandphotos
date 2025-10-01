/**
 * AvailabilityPage - Photographer Availability Calendar Management
 * Allows photographers to set available booking dates via calendar interface
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { Calendar, Clock, Eye, EyeOff, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import toast from 'react-hot-toast'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'

const AvailabilityPage = () => {
  const { user, photographerProfile, fetchUserData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const [isPublic, setIsPublic] = useState(true)
  const [isVisibleInSearch, setIsVisibleInSearch] = useState(false)

  useEffect(() => {
    loadAvailability()
  }, [photographerProfile])

  const loadAvailability = async () => {
    if (!photographerProfile) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('photographers')
        .select('available_dates, is_public, visible_in_search')
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      // Convert date strings to Date objects
      const dates = (data.available_dates || []).map(dateStr => new Date(dateStr))
      setSelectedDates(dates)
      setIsPublic(data.is_public ?? true)
      setIsVisibleInSearch(data.visible_in_search ?? false)
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load availability data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAvailability = async () => {
    setSaving(true)

    try {
      // Convert Date objects to ISO date strings (YYYY-MM-DD)
      const dateStrings = selectedDates.map(date => {
        const d = new Date(date)
        return d.toISOString().split('T')[0]
      })

      const { error } = await supabase
        .from('photographers')
        .update({
          available_dates: dateStrings,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Availability updated successfully!')

      // Reload to get updated visible_in_search status
      await loadAvailability()
      await fetchUserData()
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const handleDateSelect = (dates) => {
    setSelectedDates(dates || [])
  }

  const handleClearAllDates = () => {
    if (confirm('Are you sure you want to clear all available dates? This will make you invisible in search.')) {
      setSelectedDates([])
    }
  }

  const toggleVisibility = async () => {
    const newVisibility = !isPublic

    try {
      const { error } = await supabase
        .from('photographers')
        .update({
          is_public: newVisibility,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      setIsPublic(newVisibility)
      toast.success(`Profile ${newVisibility ? 'visible' : 'hidden'} in search`)

      // Reload to update visible_in_search status
      await loadAvailability()
      await fetchUserData()
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast.error('Failed to update visibility')
    }
  }

  // Calculate future dates and stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const futureDates = selectedDates.filter(date => date >= today)
  const pastDates = selectedDates.filter(date => date < today)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Availability Calendar
        </h1>
        <p className="text-gray-600">
          Select the dates when you're available for bookings. Only dates you select will be shown to clients.
        </p>
      </div>

      {/* Visibility Status Banner */}
      <Card className="mb-6 border-l-4" style={{ borderLeftColor: isVisibleInSearch ? '#10b981' : '#f59e0b' }}>
        <div className="flex items-start gap-4">
          <div className="mt-1">
            {isVisibleInSearch ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Info className="w-6 h-6 text-amber-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {isVisibleInSearch ? 'Visible in Client Search' : 'Not Visible in Client Search'}
            </h3>
            <p className="text-sm text-gray-600">
              {isVisibleInSearch ? (
                'Your profile is visible to clients searching for photographers.'
              ) : (
                <>
                  To appear in search results, you must:
                  <ul className="list-disc list-inside mt-1 ml-2">
                    {!isPublic && <li>Enable profile visibility below</li>}
                    {futureDates.length === 0 && <li>Select at least one future available date</li>}
                  </ul>
                </>
              )}
            </p>
          </div>
          <Button
            variant={isPublic ? 'secondary' : 'primary'}
            onClick={toggleVisibility}
            className="flex items-center gap-2"
          >
            {isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPublic ? 'Hide Profile' : 'Show Profile'}
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="md:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-pink-500" />
            <h2 className="text-xl font-semibold">Select Available Dates</h2>
          </div>

          <div className="flex justify-center">
            <DayPicker
              mode="multiple"
              selected={selectedDates}
              onSelect={handleDateSelect}
              disabled={{ before: today }}
              modifiersClassNames={{
                selected: 'bg-pink-500 text-white hover:bg-pink-600'
              }}
              className="availability-calendar"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleSaveAvailability}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearAllDates}
              disabled={selectedDates.length === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        </Card>

        {/* Stats & Info */}
        <div className="space-y-6">
          {/* Date Stats */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Availability Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Future Dates</span>
                <span className="font-semibold text-pink-600">{futureDates.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Past Dates</span>
                <span className="font-semibold text-gray-500">{pastDates.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Selected</span>
                <span className="font-semibold text-gray-900">{selectedDates.length}</span>
              </div>
            </div>
          </Card>

          {/* How It Works */}
          <Card className="p-6 bg-pink-50 border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-500" />
              How It Works
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold">1.</span>
                <span>Select dates when you're available for bookings</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold">2.</span>
                <span>Clients searching for those dates will see your profile</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold">3.</span>
                <span>You'll only appear if both visibility is ON and you have future dates</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold">4.</span>
                <span>Update your calendar anytime to stay visible</span>
              </li>
            </ul>
          </Card>

          {/* Selected Dates Preview */}
          {futureDates.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Upcoming Available Dates</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {futureDates
                  .sort((a, b) => a - b)
                  .slice(0, 10)
                  .map((date, i) => (
                    <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  ))}
                {futureDates.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{futureDates.length - 10} more dates
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default AvailabilityPage
