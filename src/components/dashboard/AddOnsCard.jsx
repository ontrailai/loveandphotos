/**
 * Add-Ons Card Component
 * Displays self-serve add-ons purchasing with payment rules
 */

import { useState, useEffect } from 'react'
import { PlusCircleIcon, AlertCircleIcon, ClockIcon, DollarSignIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@components/ui/Card'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import { supabase } from '@lib/supabase'
import { differenceInDays, parseISO } from 'date-fns'

const AddOnsCard = ({ booking }) => {
  const navigate = useNavigate()
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAddons()
  }, [booking.id])

  const loadAddons = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('booking_addons')
        .select(`
          *,
          addons (
            name,
            price_cents,
            kind
          )
        `)
        .eq('booking_id', booking.id)

      if (error) {
        // Silently handle if table doesn't exist yet (404/PGRST205)
        if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message?.includes('schema cache') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setAddons([])
          return
        }
        throw error
      }
      setAddons(data || [])
    } catch (error) {
      console.error('Error loading add-ons:', error)
    } finally {
      setLoading(false)
    }
  }

  const daysUntilEvent = differenceInDays(parseISO(booking.event_date), new Date())

  // Payment rules
  const CUTOFF_DAYS = 3
  const LATE_FEE_THRESHOLD = 30
  const FULL_ONLY_THRESHOLD = 31

  const isCutoff = daysUntilEvent < CUTOFF_DAYS
  const hasLateFee = daysUntilEvent < LATE_FEE_THRESHOLD
  const isFullPaymentOnly = daysUntilEvent < FULL_ONLY_THRESHOLD

  const handleAddOns = () => {
    if (isCutoff) {
      return // Should not be clickable
    }
    navigate(`/booking/${booking.id}/addons`)
  }

  const getPurchasedAddonsText = () => {
    if (addons.length === 0) return 'No add-ons purchased'

    const extraHours = addons.filter(a => a.addons?.kind === 'hour')
    const services = addons.filter(a => a.addons?.kind === 'addon')

    const parts = []
    if (extraHours.length > 0) {
      const totalHours = extraHours.reduce((sum, a) => sum + a.quantity, 0)
      parts.push(`${totalHours} extra hour${totalHours > 1 ? 's' : ''}`)
    }
    if (services.length > 0) {
      parts.push(`${services.length} service${services.length > 1 ? 's' : ''}`)
    }

    return parts.join(', ')
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-dusty-100 rounded-lg flex items-center justify-center">
            <PlusCircleIcon className="w-5 h-5 text-dusty-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Add-Ons & Extra Hours</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-dusty-100 rounded-lg flex items-center justify-center">
            <PlusCircleIcon className="w-5 h-5 text-dusty-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Add-Ons & Extra Hours</h3>
            <p className="text-sm text-muted-foreground">
              {getPurchasedAddonsText()}
            </p>
          </div>
        </div>
        {addons.length > 0 && (
          <Badge variant="primary" size="sm">
            {addons.length}
          </Badge>
        )}
      </div>

      {/* Cutoff Warning */}
      {isCutoff && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Add-ons unavailable</p>
              <p className="text-xs text-red-700 mt-1">
                Less than 3 days until your event. Please contact us directly for any changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Late Fee Warning */}
      {!isCutoff && hasLateFee && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <DollarSignIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">Late fee applies</p>
              <p className="text-xs text-yellow-700 mt-1">
                A $450 late fee will be added to purchases made within 30 days of your event
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full Payment Only Warning */}
      {!isCutoff && isFullPaymentOnly && !hasLateFee && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <ClockIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Full payment required</p>
              <p className="text-xs text-blue-700 mt-1">
                Payment plans are not available within 31-59 days of your event
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        variant={isCutoff ? "outline" : "primary"}
        size="sm"
        className="w-full"
        onClick={handleAddOns}
        disabled={isCutoff}
      >
        <PlusCircleIcon className="w-4 h-4 mr-2" />
        {addons.length > 0 ? 'Manage Add-Ons' : 'Browse Add-Ons'}
      </Button>

      {!isCutoff && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Days until event:</span>
            <span className="font-semibold">{daysUntilEvent}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>Deadline for add-ons:</span>
            <span className={daysUntilEvent <= 7 ? 'text-yellow-600 font-semibold' : ''}>
              {daysUntilEvent - CUTOFF_DAYS} days remaining
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

export default AddOnsCard