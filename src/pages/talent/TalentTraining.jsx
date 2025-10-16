import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

const TalentTraining = () => {
  const { user, photographerProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const videoRef = useRef(null)
  const maxWatchedTime = useRef(0)

  const TRAINING_VIDEO_URL = 'https://storage.googleapis.com/msgsndr/dXIak5GUkwrvs0TMnFOH/media/68d372de037a13df77ed44a8.mp4'
  const STORAGE_KEY = `training_video_watched_${user?.id}`

  // Check if user has already watched the video in this session
  useEffect(() => {
    if (user?.id) {
      const hasWatchedBefore = sessionStorage.getItem(STORAGE_KEY) === 'true'
      if (hasWatchedBefore) {
        setVideoCompleted(true)
        setWatchProgress(100)
      }
    }
  }, [user?.id, STORAGE_KEY])

  // Autoplay video on mount
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Attempt to autoplay (with muted fallback for browser restrictions)
      video.muted = true
      video.play().catch((error) => {
        console.log('[TalentTraining] Autoplay failed, user interaction may be required:', error)
      })
    }
  }, [])

  // Prevent seeking ahead - only allow watching forward
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleSeeking = () => {
      // If user tries to seek ahead of their max watched time, reset to max watched
      if (video.currentTime > maxWatchedTime.current + 0.5) {
        console.log('[TalentTraining] Prevented seeking ahead')
        video.currentTime = maxWatchedTime.current
      }
    }

    const handleTimeUpdate = () => {
      // Track maximum time the user has watched to
      if (video.currentTime > maxWatchedTime.current) {
        maxWatchedTime.current = video.currentTime
      }

      // Update progress bar
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100
        setWatchProgress(progress)
      }
    }

    // Disable right-click context menu on video
    const handleContextMenu = (e) => {
      e.preventDefault()
    }

    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('contextmenu', handleContextMenu)

    return () => {
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  // Handle video completion
  const handleVideoEnd = () => {
    console.log('[TalentTraining] Video playback completed')
    setVideoCompleted(true)
    // Store in sessionStorage for reload protection
    sessionStorage.setItem(STORAGE_KEY, 'true')
  }

  const handleContinue = async () => {
    if (!videoCompleted) {
      toast.error('Please watch the entire training video before continuing')
      return
    }

    if (!hasAccepted) {
      toast.error('Please confirm you have watched and understood the training')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Completing training...')

    try {
      // Update training_completed in database
      const { error } = await supabase
        .from('photographers')
        .update({ training_completed: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (error) {
        console.error('[TalentTraining] Error updating training status:', error)
        throw error
      }

      // Clear session storage after successful completion
      sessionStorage.removeItem(STORAGE_KEY)

      // Refresh profile to get updated training status
      await refreshProfile()

      toast.success('Training completed! Redirecting to dashboard...', { id: loadingToast })

      // Redirect based on role
      if (photographerProfile?.is_videographer) {
        navigate('/talent/dashboard/videographer', { replace: true })
      } else {
        navigate('/talent/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('[TalentTraining] Failed to complete training:', error)
      toast.error('Failed to complete training. Please try again.', { id: loadingToast })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Love & Photos — Training Required
          </h1>
          <p className="text-lg text-gray-600">
            Before you can access your dashboard, please watch the following training video to understand all talent expectations.
          </p>
        </div>

        {/* Video Player */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="aspect-video bg-black relative">
            <video
              ref={videoRef}
              src={TRAINING_VIDEO_URL}
              className="w-full h-full"
              onEnded={handleVideoEnd}
              playsInline
            >
              Your browser does not support the video tag.
            </video>

            {/* Custom Progress Bar */}
            {!videoCompleted && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 bg-opacity-50">
                <div
                  className="h-full bg-primary-600 transition-all duration-200"
                  style={{ width: `${watchProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Video Completion Status */}
          {videoCompleted && (
            <div className="bg-green-50 border-t-2 border-green-500 px-6 py-3">
              <p className="text-green-800 text-sm font-medium flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Video completed! You can now check the acknowledgment below.
              </p>
            </div>
          )}
          {!videoCompleted && (
            <div className="bg-amber-50 border-t-2 border-amber-500 px-6 py-3">
              <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                <span className="text-amber-600">⏵</span>
                Video is playing - please watch the entire video to continue ({Math.floor(watchProgress)}% watched)
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start space-x-3 mb-6">
            <input
              type="checkbox"
              id="training-confirmation"
              checked={hasAccepted}
              onChange={(e) => setHasAccepted(e.target.checked)}
              disabled={!videoCompleted}
              className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            <label
              htmlFor="training-confirmation"
              className={`text-gray-700 font-medium select-none ${
                videoCompleted ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              ✅ I confirm I have watched the training video and understand all talent expectations.
            </label>
          </div>

          {!videoCompleted && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> The acknowledgment checkbox will be enabled once you have watched the entire video.
              </p>
            </div>
          )}

          <Button
            onClick={handleContinue}
            disabled={!videoCompleted || !hasAccepted || isSubmitting}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Continue to Dashboard'}
          </Button>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
          <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
            <li>This training is mandatory for all new photographers and videographers</li>
            <li>You must watch the entire video before you can continue</li>
            <li>Your dashboard access will be granted immediately after completing this training</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TalentTraining
