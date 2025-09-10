/**
 * Photographer Job Queue Component
 * Dashboard for photographers to manage their upcoming jobs
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CameraIcon,
  UploadIcon,
  FileTextIcon,
  ChevronRightIcon,
  PackageIcon,
  AlertTriangleIcon,
  MessageSquareIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import Avatar from '@components/shared/Avatar'
import { supabase } from '@lib/supabase'
import { format, isPast, isFuture, differenceInDays, addDays } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const JobQueue = () => {
  const { user, photographerProfile } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [filter, setFilter] = useState('all') // all, upcoming, overdue, completed
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    overdue: 0,
    readyToUpload: 0
  })

  useEffect(() => {
    if (photographerProfile?.id) {
      loadJobs()
    }
  }, [photographerProfile, filter])

  const loadJobs = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:users!customer_id (
            full_name,
            email,
            phone,
            avatar_url
          ),
          packages (
            title,
            duration_minutes,
            deliverables
          ),
          job_queue!inner (
            id,
            upload_status,
            overtime_logged,
            delivery_url,
            deadline,
            delivered_at,
            notes
          )
        `)
        .eq('photographer_id', photographerProfile.id)
        .order('event_date', { ascending: true })

      // Apply filters
      if (filter === 'upcoming') {
        query = query.gte('event_date', new Date().toISOString())
        query = query.neq('job_queue.upload_status', 'completed')
      } else if (filter === 'overdue') {
        query = query.lt('job_queue.deadline', new Date().toISOString())
        query = query.neq('job_queue.upload_status', 'completed')
      } else if (filter === 'completed') {
        query = query.eq('job_queue.upload_status', 'completed')
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        setJobs(data)
        
        // Calculate stats
        const upcomingJobs = data.filter(j => isFuture(new Date(j.event_date)) && j.job_queue?.[0]?.upload_status !== 'completed')
        const overdueJobs = data.filter(j => {
          const deadline = j.job_queue?.[0]?.deadline
          return deadline && isPast(new Date(deadline)) && j.job_queue?.[0]?.upload_status !== 'completed'
        })
        const readyToUpload = data.filter(j => isPast(new Date(j.event_date)) && j.job_queue?.[0]?.upload_status === 'pending')

        setStats({
          total: data.length,
          upcoming: upcomingJobs.length,
          overdue: overdueJobs.length,
          readyToUpload: readyToUpload.length
        })
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast.error('Failed to load job queue')
    } finally {
      setLoading(false)
    }
  }

  const markAsReadyToUpload = async (jobId, bookingId) => {
    try {
      const { error } = await supabase
        .from('job_queue')
        .update({ 
          upload_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error

      toast.success('Job marked as ready to upload')
      loadJobs()
      
      // Navigate to upload page
      navigate(`/dashboard/photographer/uploads?job=${jobId}&booking=${bookingId}`)
    } catch (error) {
      console.error('Error updating job status:', error)
      toast.error('Failed to update job status')
    }
  }

  const getDeadlineStatus = (job) => {
    if (!job.job_queue?.[0]?.deadline) return null
    
    const deadline = new Date(job.job_queue[0].deadline)
    const daysUntilDeadline = differenceInDays(deadline, new Date())
    
    if (job.job_queue[0].upload_status === 'completed') {
      return { type: 'success', label: 'Delivered' }
    }
    
    if (isPast(deadline)) {
      return { type: 'danger', label: `${Math.abs(daysUntilDeadline)} days overdue` }
    }
    
    if (daysUntilDeadline <= 3) {
      return { type: 'warning', label: `Due in ${daysUntilDeadline} days` }
    }
    
    return { type: 'default', label: `Due in ${daysUntilDeadline} days` }
  }

  const viewPersonalizationData = (booking) => {
    if (booking.personalization_data?.quizCompleted) {
      setSelectedJob(booking)
    } else {
      toast.info('Client has not completed the style quiz yet')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blush-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-dusty-900">
                Job Queue
              </h1>
              <p className="text-dusty-600 mt-1">
                Manage your upcoming photography sessions
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard/photographer/uploads')}>
              <UploadIcon className="w-5 h-5 mr-2" />
              Upload Center
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className={clsx(
              'cursor-pointer transition-all',
              filter === 'all' && 'ring-2 ring-blush-500'
            )}
            onClick={() => setFilter('all')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dusty-600 text-sm">Total Jobs</p>
                <p className="text-2xl font-bold text-dusty-900">{stats.total}</p>
              </div>
              <PackageIcon className="w-8 h-8 text-dusty-400" />
            </div>
          </Card>

          <Card 
            className={clsx(
              'cursor-pointer transition-all',
              filter === 'upcoming' && 'ring-2 ring-blush-500'
            )}
            onClick={() => setFilter('upcoming')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">Upcoming</p>
                <p className="text-2xl font-bold text-blue-900">{stats.upcoming}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-blue-400" />
            </div>
          </Card>

          <Card 
            className={clsx(
              'cursor-pointer transition-all',
              filter === 'overdue' && 'ring-2 ring-blush-500'
            )}
            onClick={() => setFilter('overdue')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
              </div>
              <AlertTriangleIcon className="w-8 h-8 text-red-400" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">Ready to Upload</p>
                <p className="text-2xl font-bold text-green-900">{stats.readyToUpload}</p>
              </div>
              <UploadIcon className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card className="text-center py-12">
              <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-dusty-900 mb-2">
                No jobs in queue
              </h3>
              <p className="text-dusty-600 max-w-md mx-auto">
                Jobs will appear here once clients book your services
              </p>
            </Card>
          ) : (
            jobs.map((job) => {
              const deadlineStatus = getDeadlineStatus(job)
              const isOverdue = deadlineStatus?.type === 'danger'
              const eventPassed = isPast(new Date(job.event_date))
              
              return (
                <Card 
                  key={job.id} 
                  className={clsx(
                    'transition-all',
                    isOverdue && 'border-red-200 bg-red-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar
                        src={job.customer?.avatar_url}
                        name={job.customer?.full_name}
                        size="lg"
                      />
                      <div className="flex-1">
                        {/* Client Info */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-dusty-900">
                              {job.customer?.full_name}
                            </h3>
                            <p className="text-sm text-dusty-600">
                              {job.event_type} • {job.packages?.title}
                            </p>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-dusty-600">
                            <CalendarIcon className="w-4 h-4 mr-2 text-dusty-400" />
                            {format(new Date(job.event_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center text-sm text-dusty-600">
                            <ClockIcon className="w-4 h-4 mr-2 text-dusty-400" />
                            {job.event_time} • {job.packages?.duration_minutes} min
                          </div>
                          <div className="flex items-center text-sm text-dusty-600">
                            <MapPinIcon className="w-4 h-4 mr-2 text-dusty-400" />
                            {job.venue_name}
                          </div>
                        </div>

                        {/* Venue Address */}
                        {job.venue_address && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-dusty-700">
                              {job.venue_address.street}, {job.venue_address.city}, {job.venue_address.state} {job.venue_address.zip}
                            </p>
                          </div>
                        )}

                        {/* Quiz & Contact Info */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.personalization_data?.quizCompleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewPersonalizationData(job)}
                            >
                              <FileTextIcon className="w-4 h-4 mr-2" />
                              View Style Preferences
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `tel:${job.customer?.phone}`}
                          >
                            📞 {job.customer?.phone}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `mailto:${job.customer?.email}`}
                          >
                            ✉️ {job.customer?.email}
                          </Button>
                        </div>

                        {/* Status Bar */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-4">
                            {deadlineStatus && (
                              <Badge 
                                variant={deadlineStatus.type}
                                className={clsx(
                                  deadlineStatus.type === 'danger' && 'animate-pulse'
                                )}
                              >
                                {deadlineStatus.label}
                              </Badge>
                            )}
                            
                            {job.job_queue?.[0]?.upload_status && (
                              <Badge variant={
                                job.job_queue[0].upload_status === 'completed' ? 'success' :
                                job.job_queue[0].upload_status === 'in_progress' ? 'warning' : 'default'
                              }>
                                {job.job_queue[0].upload_status === 'completed' ? 'Delivered' :
                                 job.job_queue[0].upload_status === 'in_progress' ? 'Uploading' : 'Pending'}
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {eventPassed && job.job_queue?.[0]?.upload_status === 'pending' && (
                              <Button
                                onClick={() => markAsReadyToUpload(job.job_queue[0].id, job.id)}
                                size="sm"
                              >
                                <UploadIcon className="w-4 h-4 mr-2" />
                                Start Upload
                              </Button>
                            )}
                            
                            {job.job_queue?.[0]?.upload_status === 'in_progress' && (
                              <Button
                                onClick={() => navigate(`/dashboard/photographer/uploads?job=${job.job_queue[0].id}&booking=${job.id}`)}
                                variant="outline"
                                size="sm"
                              >
                                Continue Upload
                                <ChevronRightIcon className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                            
                            {job.job_queue?.[0]?.upload_status === 'completed' && (
                              <Badge variant="success" className="px-3 py-1">
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Delivered
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Style Preferences Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-dusty-900">
                Style Preferences for {selectedJob.customer?.full_name}
              </h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-dusty-400 hover:text-dusty-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Photography Style */}
              <div>
                <h4 className="font-medium text-dusty-900 mb-2">Photography Style</h4>
                <p className="text-dusty-600">
                  {selectedJob.personalization_data?.style || 'Not specified'}
                </p>
              </div>

              {/* Must-Have Shots */}
              {selectedJob.personalization_data?.shots && (
                <div>
                  <h4 className="font-medium text-dusty-900 mb-2">Must-Have Shots</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.personalization_data.shots.map((shot, index) => (
                      <Badge key={index} variant="secondary">
                        {shot}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Music Preference */}
              {selectedJob.personalization_data?.musicMood && (
                <div>
                  <h4 className="font-medium text-dusty-900 mb-2">Video Music Mood</h4>
                  <p className="text-dusty-600">
                    {selectedJob.personalization_data.musicMood}
                  </p>
                </div>
              )}

              {/* Special Notes */}
              {selectedJob.personalization_data?.notes && (
                <div>
                  <h4 className="font-medium text-dusty-900 mb-2">Special Notes</h4>
                  <p className="text-dusty-600 bg-gray-50 rounded-lg p-4">
                    {selectedJob.personalization_data.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default JobQueue
