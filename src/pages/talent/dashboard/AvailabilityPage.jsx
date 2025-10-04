/**
 * AvailabilityPage - Photographer Availability Calendar Management
 * Allows photographers to block out unavailable dates via calendar interface
 * INVERSE MODEL: All future dates are AVAILABLE by default unless blocked
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
  const [blockedDates, setBlockedDates] = useState([]) // Renamed from selectedDates
  const [isPublic, setIsPublic] = useState(true)
  const [isVisibleInSearch, setIsVisibleInSearch] = useState(false)

  useEffect(() => {
    loadAvailability()
  }, [photographerProfile?.user_id]) // Only depend on stable ID to prevent infinite loop

  const loadAvailability = async () => {
    if (!photographerProfile) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('photographers')
        .select('unavailable_dates, is_public, visible_in_search')
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      // Convert date strings to Date objects
      const dates = (data.unavailable_dates || []).map(dateStr => new Date(dateStr))
      setBlockedDates(dates)
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
      const dateStrings = blockedDates.map(date => {
        const d = new Date(date)
        return d.toISOString().split('T')[0]
      })

      const { error } = await supabase
        .from('photographers')
        .update({
          unavailable_dates: dateStrings,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Availability updated successfully!')

      // Refresh user data which will trigger loadAvailability via useEffect
      if (user) {
        await fetchUserData(user)
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const handleDateSelect = (dates) => {
    setBlockedDates(dates || [])
  }

  const handleClearAllDates = () => {
    if (confirm('Are you sure you want to clear all blocked dates? This will make your calendar fully available.')) {
      setBlockedDates([])
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

      // Refresh user data which will trigger loadAvailability via useEffect
      if (user) {
        await fetchUserData(user)
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast.error('Failed to update visibility')
    }
  }

  // Calculate future dates and stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const futureBlockedDates = blockedDates.filter(date => date >= today)
  const pastBlockedDates = blockedDates.filter(date => date < today)

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
          <strong>All future dates are available by default.</strong> Select dates when you're <strong>NOT available</strong> to block them from client bookings.
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
                'Your profile is visible to clients searching for photographers. Your calendar shows all future dates as available except those you\'ve blocked.'
              ) : (
                <>
                  To appear in search results, you must enable profile visibility below.
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
            <h2 className="text-xl font-semibold">Block Unavailable Dates</h2>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <strong>Legend:</strong>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>✅ Available (default) - Clients can book these dates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-6 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center">X</span>
                    <span>❌ Unavailable (blocked) - You cannot be booked on these dates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <DayPicker
              mode="multiple"
              selected={blockedDates}
              onSelect={handleDateSelect}
              disabled={{ before: today }}
              modifiersClassNames={{
                selected: 'bg-red-500 text-white hover:bg-red-600'
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
              {saving ? 'Saving...' : 'Save Blocked Dates'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearAllDates}
              disabled={blockedDates.length === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Blocks
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
                <span className="text-sm text-gray-600">Future Blocked Dates</span>
                <span className="font-semibold text-red-600">{futureBlockedDates.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Past Blocked Dates</span>
                <span className="font-semibold text-gray-500">{pastBlockedDates.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Blocked</span>
                <span className="font-semibold text-gray-900">{blockedDates.length}</span>
              </div>
            </div>
          </Card>

          {/* How It Works */}
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              How It Works
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">1.</span>
                <span><strong>All future dates are available by default</strong> - no need to select anything!</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">2.</span>
                <span>Click dates to <strong>block them</strong> when you're unavailable</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">3.</span>
                <span>Clients can book any date that's <strong>not blocked</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">4.</span>
                <span>You appear in search as long as your profile is public</span>
              </li>
            </ul>
          </Card>

          {/* Blocked Dates Preview */}
          {futureBlockedDates.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Upcoming Blocked Dates</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {futureBlockedDates
                  .sort((a, b) => a - b)
                  .slice(0, 10)
                  .map((date, i) => (
                    <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-500" />
                      {date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  ))}
                {futureBlockedDates.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{futureBlockedDates.length - 10} more blocked dates
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Fully Available Message */}
          {futureBlockedDates.length === 0 && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Fully Available!</h3>
                <p className="text-sm text-gray-700">
                  Your calendar is completely open. Clients can book you for any future date.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default AvailabilityPage
