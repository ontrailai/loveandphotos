/**
 * Questionnaires Card Component
 * Displays status of style and wedding info questionnaires
 */

import { useState, useEffect } from 'react'
import { ClipboardListIcon, CheckCircleIcon, AlertCircleIcon, LockIcon, ChevronRightIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@components/ui/Card'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import { supabase } from '@lib/supabase'
import { differenceInDays, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const QuestionnaireTile = ({ booking, type, title, description, lockThreshold }) => {
  const navigate = useNavigate()
  const [questionnaire, setQuestionnaire] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestionnaire()
  }, [booking.id, type])

  const loadQuestionnaire = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('booking_id', booking.id)
        .eq('type', type)
        .maybeSingle()

      if (error) {
        // Silently handle if table doesn't exist yet (404/PGRST205) or no rows found
        if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message?.includes('schema cache') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setQuestionnaire(null)
          return
        }
        throw error
      }
      setQuestionnaire(data)
    } catch (error) {
      console.error('Error loading questionnaire:', error)
      toast.error(`Failed to load ${title}`)
    } finally {
      setLoading(false)
    }
  }

  const daysUntilEvent = differenceInDays(parseISO(booking.event_date), new Date())
  const isLocked = daysUntilEvent < lockThreshold
  const status = questionnaire?.status || 'not_started'
  const progress = questionnaire?.answered_questions || 0
  const totalQuestions = type === 'style' ? 8 : 9

  const getStatusInfo = () => {
    if (isLocked && status !== 'completed') {
      return {
        badge: <Badge variant="danger" size="sm">Locked</Badge>,
        icon: <LockIcon className="w-4 h-4 text-red-600" />,
        message: `Locked - less than ${lockThreshold} days until event`
      }
    }

    switch (status) {
      case 'completed':
        return {
          badge: <Badge variant="success" size="sm">Complete</Badge>,
          icon: <CheckCircleIcon className="w-4 h-4 text-green-600" />,
          message: `All ${totalQuestions} questions answered`
        }
      case 'in_progress':
        return {
          badge: <Badge variant="warning" size="sm">In Progress</Badge>,
          icon: <AlertCircleIcon className="w-4 h-4 text-yellow-600" />,
          message: `${progress}/${totalQuestions} questions answered`
        }
      case 'not_started':
      default:
        return {
          badge: <Badge variant="secondary" size="sm">Not Started</Badge>,
          icon: <ClipboardListIcon className="w-4 h-4 text-gray-600" />,
          message: 'Click to begin'
        }
    }
  }

  const handleClick = () => {
    if (isLocked && status !== 'completed') {
      toast.error(`This questionnaire is locked. Less than ${lockThreshold} days until your event.`)
      return
    }

    // Navigate to questionnaire page
    navigate(`/questionnaire/${booking.id}/${type}`)
  }

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  const statusInfo = getStatusInfo()

  return (
    <div
      className={`p-4 bg-gray-50 rounded-lg border transition-all ${
        isLocked && status !== 'completed'
          ? 'border-red-200 bg-red-50'
          : status === 'completed'
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {statusInfo.icon}
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        {statusInfo.badge}
      </div>

      <p className="text-sm text-muted-foreground mb-3">{description}</p>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {statusInfo.message}
        </div>
        {!isLocked && status !== 'completed' && (
          <ChevronRightIcon className="w-4 h-4 text-primary-600" />
        )}
      </div>

      {/* Progress Bar */}
      {status === 'in_progress' && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${(progress / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Warning for approaching deadline */}
      {!isLocked && status !== 'completed' && daysUntilEvent <= lockThreshold + 7 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <AlertCircleIcon className="w-3 h-3 inline mr-1" />
          Complete within {daysUntilEvent} days or it will lock
        </div>
      )}
    </div>
  )
}

const QuestionnairesCard = ({ booking }) => {
  return (
    <Card>
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
          <ClipboardListIcon className="w-5 h-5 text-sage-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Questionnaires</h3>
          <p className="text-sm text-muted-foreground">
            Help us prepare for your big day
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <QuestionnaireTile
          booking={booking}
          type="style"
          title="Style Preferences"
          description="Tell us about your photography style preferences"
          lockThreshold={14}
        />

        <QuestionnaireTile
          booking={booking}
          type="wedding_info"
          title="Wedding Logistics"
          description="Share details about your event schedule and shot list"
          lockThreshold={7}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
        💡 Tip: Complete questionnaires early - they lock automatically before your event
      </div>
    </Card>
  )
}

export default QuestionnairesCard