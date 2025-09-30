/**
 * LogisticsCard Component
 * Pre-wedding logistics questionnaire (T-60 days)
 * Minimal client-side form with direct Supabase integration
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { parseISO, subDays, isAfter, differenceInDays, format } from 'date-fns'
import toast from 'react-hot-toast'
import Card from '@components/ui/Card'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import { ClipboardCheckIcon, ClockIcon, CheckCircleIcon } from 'lucide-react'

const LogisticsCard = ({ booking }) => {
  const { user } = useAuth()
  const [logistics, setLogistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    ceremony_time_location: '',
    reception_time_location: '',
    getting_ready_location: '',
    first_look_choice: '',
    first_look_location: '',
    contact_name: '',
    contact_phone: '',
    must_have_photos: '',
    venue_restrictions: ''
  })

  // Calculate T-60 threshold
  const eventDate = parseISO(booking.event_date)
  const sixtyDaysBefore = subDays(eventDate, 60)
  const today = new Date()
  const isWithinT60 = isAfter(today, sixtyDaysBefore)
  const daysUntilT60 = differenceInDays(sixtyDaysBefore, today)

  // Load existing logistics or create draft
  useEffect(() => {
    if (!booking?.id || !user?.id) return

    const loadLogistics = async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from('logistics_questionnaire')
          .select('*')
          .eq('booking_id', booking.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setLogistics(data)
          setFormData(data.answers || formData)
        } else if (isWithinT60) {
          // Create draft record
          const { data: newData, error: insertError } = await supabase
            .from('logistics_questionnaire')
            .insert([{
              booking_id: booking.id,
              user_id: user.id,
              status: 'not_started',
              answers: {}
            }])
            .select()
            .single()

          if (insertError) throw insertError
          setLogistics(newData)
        }
      } catch (error) {
        console.error('Error loading logistics:', error)
        toast.error('Failed to load logistics questionnaire')
      } finally {
        setLoading(false)
      }
    }

    loadLogistics()
  }, [booking?.id, user?.id, isWithinT60])

  // Debounced auto-save
  const saveAnswers = useCallback(async (answers, status = 'in_progress') => {
    if (!logistics?.id) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('logistics_questionnaire')
        .update({
          answers,
          status
        })
        .eq('id', logistics.id)

      if (error) throw error

      setLogistics(prev => ({ ...prev, answers, status }))
    } catch (error) {
      console.error('Error saving logistics:', error)
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }, [logistics?.id])

  // Handle field changes
  const handleFieldChange = (field, value) => {
    const updatedData = { ...formData, [field]: value }
    setFormData(updatedData)

    // Auto-save after 500ms delay
    const timeoutId = setTimeout(() => {
      saveAnswers(updatedData)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  // Validate required fields
  const validateForm = () => {
    const required = [
      'ceremony_time_location',
      'reception_time_location',
      'getting_ready_location',
      'first_look_choice',
      'contact_name',
      'contact_phone'
    ]

    // Conditional validation: first_look_location required if first_look_choice is 'yes'
    if (formData.first_look_choice === 'yes') {
      required.push('first_look_location')
    }

    const missing = required.filter(field => !formData[field] || formData[field].trim() === '')
    return missing.length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }

    await saveAnswers(formData, 'submitted')
    toast.success('Logistics questionnaire submitted!')
  }

  // Loading state
  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded" />
      </Card>
    )
  }

  // Pre-T-60 countdown state
  if (!isWithinT60) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Wedding Day Logistics</h4>
              <p className="text-sm text-muted-foreground">
                Opens in {Math.abs(daysUntilT60)} days
              </p>
            </div>
          </div>
          <Badge variant="secondary" size="sm">
            Opens {format(sixtyDaysBefore, 'MMM dd')}
          </Badge>
        </div>
      </Card>
    )
  }

  // Submitted/read-only state
  if (logistics?.status === 'submitted') {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Wedding Day Logistics</h4>
              <p className="text-sm text-muted-foreground">
                Thanks! You can still message support if plans change.
              </p>
            </div>
          </div>
          <Badge variant="success" size="sm">Submitted</Badge>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-foreground">Ceremony: </span>
            <span className="text-muted-foreground">{formData.ceremony_time_location || 'Not provided'}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Reception: </span>
            <span className="text-muted-foreground">{formData.reception_time_location || 'Not provided'}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Getting ready: </span>
            <span className="text-muted-foreground">{formData.getting_ready_location || 'Not provided'}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Contact: </span>
            <span className="text-muted-foreground">
              {formData.contact_name} ({formData.contact_phone})
            </span>
          </div>
        </div>
      </Card>
    )
  }

  // Active form state
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <ClipboardCheckIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Wedding Day Logistics</h4>
            <p className="text-sm text-muted-foreground">
              Takes ~3 minutes. Helps your photographer prep.
            </p>
          </div>
        </div>
        {saving && (
          <Badge variant="secondary" size="sm">Saving...</Badge>
        )}
      </div>

      <form className="space-y-4">
        {/* Ceremony time & location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Ceremony time & location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.ceremony_time_location}
            onChange={(e) => handleFieldChange('ceremony_time_location', e.target.value)}
            placeholder="e.g., 3:00 PM at St. Mary's Church, 123 Main St"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
          />
        </div>

        {/* Reception time & location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Reception time & location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.reception_time_location}
            onChange={(e) => handleFieldChange('reception_time_location', e.target.value)}
            placeholder="e.g., 6:00 PM at The Grand Ballroom, 456 Oak Ave"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
          />
        </div>

        {/* Getting-ready location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Getting-ready location(s) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.getting_ready_location}
            onChange={(e) => handleFieldChange('getting_ready_location', e.target.value)}
            placeholder="e.g., Bride at Hotel Suite 305, Groom at 789 Elm St"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
          />
        </div>

        {/* First look */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            First look? <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="first_look"
                value="yes"
                checked={formData.first_look_choice === 'yes'}
                onChange={(e) => handleFieldChange('first_look_choice', e.target.value)}
                className="mr-2"
              />
              <span className="text-foreground">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="first_look"
                value="no"
                checked={formData.first_look_choice === 'no'}
                onChange={(e) => handleFieldChange('first_look_choice', e.target.value)}
                className="mr-2"
              />
              <span className="text-foreground">No</span>
            </label>
          </div>
        </div>

        {/* First look location (conditional) */}
        {formData.first_look_choice === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Where will the first look be? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.first_look_location}
              onChange={(e) => handleFieldChange('first_look_location', e.target.value)}
              placeholder="e.g., Garden at 123 Park Ln"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
            />
          </div>
        )}

        {/* Contact name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Main day-of contact (name) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.contact_name}
            onChange={(e) => handleFieldChange('contact_name', e.target.value)}
            placeholder="e.g., Maid of Honor - Sarah Johnson"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
          />
        </div>

        {/* Contact phone */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Main day-of contact (phone) <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => handleFieldChange('contact_phone', e.target.value)}
            placeholder="e.g., (555) 123-4567"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
          />
        </div>

        {/* Must-have photos */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Must-have photos / traditions
          </label>
          <textarea
            value={formData.must_have_photos}
            onChange={(e) => handleFieldChange('must_have_photos', e.target.value)}
            placeholder="e.g., Unity candle ceremony, family photos with grandparents..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
          />
        </div>

        {/* Venue restrictions */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Venue restrictions or notes
          </label>
          <textarea
            value={formData.venue_restrictions}
            onChange={(e) => handleFieldChange('venue_restrictions', e.target.value)}
            placeholder="e.g., No flash photography during ceremony, outdoor backup plan is..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
          />
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleSubmit}
            disabled={!validateForm() || saving}
            loading={saving}
          >
            Submit Logistics
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            * Required fields
          </p>
        </div>
      </form>
    </Card>
  )
}

export default LogisticsCard