/**
 * Change Date Success Page
 * Displayed after successful $495 payment for date change
 * Shows calendar modal to select new date
 */

import { useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import DateChangeCalendarModal from '@components/dashboard/DateChangeCalendarModal'
import toast from 'react-hot-toast'

const ChangeDateSuccess = () => {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Validate required parameters
    if (!bookingId || !sessionId) {
      toast.error('Invalid payment session')
      navigate('/dashboard')
    }
  }, [bookingId, sessionId, navigate])

  const handleSuccess = () => {
    toast.success('Your booking has been updated successfully!')
    navigate('/dashboard')
  }

  if (!bookingId || !sessionId) {
    return null
  }

  return (
    <DateChangeCalendarModal
      bookingId={bookingId}
      sessionId={sessionId}
      onSuccess={handleSuccess}
    />
  )
}

export default ChangeDateSuccess
