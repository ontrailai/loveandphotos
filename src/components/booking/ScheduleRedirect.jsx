/**
 * ScheduleRedirect Component
 * Redirects schedule step to photographer profile page
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const ScheduleRedirect = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (photographerId) {
      navigate(`/photographer/${photographerId}`, { replace: true })
    } else {
      navigate('/browse', { replace: true })
    }
  }, [photographerId, navigate])

  return null
}

export default ScheduleRedirect