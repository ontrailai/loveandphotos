import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

const TalentTraining = () => {
  const { user, photographerProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [hasWatched, setHasWatched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const TRAINING_VIDEO_URL = 'https://storage.googleapis.com/msgsndr/dXIak5GUkwrvs0TMnFOH/media/68d372de037a13df77ed44a8.mp4'

  const handleContinue = async () => {
    if (!hasWatched) {
      toast.error('Please confirm you have watched the training video')
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
          <div className="aspect-video bg-black">
            <video
              src={TRAINING_VIDEO_URL}
              controls
              controlsList="nodownload"
              className="w-full h-full"
              onEnded={() => setHasWatched(true)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Confirmation Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start space-x-3 mb-6">
            <input
              type="checkbox"
              id="training-confirmation"
              checked={hasWatched}
              onChange={(e) => setHasWatched(e.target.checked)}
              className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
            />
            <label
              htmlFor="training-confirmation"
              className="text-gray-700 font-medium cursor-pointer select-none"
            >
              ✅ I confirm I have watched the training video and understand all talent expectations.
            </label>
          </div>

          <Button
            onClick={handleContinue}
            disabled={!hasWatched || isSubmitting}
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
