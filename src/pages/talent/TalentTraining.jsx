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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
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

  // Autoplay video on mount and handle unmuting
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Attempt to autoplay with sound first
      video.muted = false
      setIsMuted(false)
      video.play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          console.log('[TalentTraining] Autoplay with sound failed, trying muted autoplay:', error)
          // If autoplay with sound fails due to browser policy, play muted
          video.muted = true
          setIsMuted(true)
          video.play()
            .then(() => {
              setIsPlaying(true)
            })
            .catch((muteError) => {
              console.log('[TalentTraining] Muted autoplay also failed, user interaction required:', muteError)
            })
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
    setIsPlaying(false)
    // Store in sessionStorage for reload protection
    sessionStorage.setItem(STORAGE_KEY, 'true')
  }

  // Custom control handlers
  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().then(() => setIsPlaying(true))
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
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
      console.log('[TalentTraining] Starting training completion for user:', user.id)
      console.log('[TalentTraining] Supabase client initialized:', !!supabase)
      console.log('[TalentTraining] Current auth state:', { hasUser: !!user, userId: user?.id })

      // Add timeout to prevent hanging indefinitely
      const updatePromise = supabase
        .from('photographers')
        .update({ training_completed: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Update timed out after 10 seconds')), 10000)
      )

      console.log('[TalentTraining] Executing database update...')
      const { data, error } = await Promise.race([updatePromise, timeoutPromise])

      console.log('[TalentTraining] Update response:', { data, error })

      if (error) {
        console.error('[TalentTraining] Error updating training status:', error)
        throw error
      }

      console.log('[TalentTraining] Training status updated successfully')

      // Clear session storage after successful completion
      sessionStorage.removeItem(STORAGE_KEY)

      // CRITICAL: Refresh profile to get updated training_completed status
      // This prevents ProtectedRoute from redirecting back to training
      console.log('[TalentTraining] Refreshing profile to get updated training status...')
      await refreshProfile()
      console.log('[TalentTraining] Profile refreshed successfully')

      toast.success('Training completed! Redirecting to dashboard...', { id: loadingToast })

      // Small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirect based on role
      console.log('[TalentTraining] Redirecting to dashboard...')
      if (photographerProfile?.is_videographer) {
        navigate('/talent/dashboard/videographer', { replace: true })
      } else {
        navigate('/talent/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('[TalentTraining] Failed to complete training:', error)
      toast.error(error.message || 'Failed to complete training. Please try again.', { id: loadingToast })
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

            {/* Custom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-200"
                    style={{ width: `${watchProgress}%` }}
                  />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  {/* Play/Pause Button */}
                  <button
                    onClick={togglePlayPause}
                    className="hover:text-primary-400 transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  {/* Volume Button */}
                  <button
                    onClick={toggleMute}
                    className="hover:text-primary-400 transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>

                  {/* Progress Text */}
                  <div className="text-sm font-medium">
                    {Math.floor(watchProgress)}% watched
                  </div>
                </div>

                {videoCompleted && (
                  <div className="text-sm font-medium text-green-400 flex items-center gap-2">
                    <span>✓</span>
                    <span>Complete</span>
                  </div>
                )}
              </div>
            </div>
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
