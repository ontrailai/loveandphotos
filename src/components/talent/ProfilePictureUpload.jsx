import { useState, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { Camera, Upload, X, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const ProfilePictureUpload = ({ userId, currentAvatarUrl, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl)
  const fileInputRef = useRef(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

  const validateFile = (file) => {
    if (!file) {
      return { valid: false, error: 'No file selected' }
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only JPG and PNG files are allowed' }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' }
    }

    return { valid: true }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload immediately
    await uploadFile(file)
  }

  const uploadFile = async (file) => {
    setUploading(true)
    const uploadingToast = toast.loading('Uploading profile picture...')

    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      console.log('[ProfilePictureUpload] Uploading to avatars bucket:', filePath)

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        try {
          const oldFileName = currentAvatarUrl.split('/').pop()
          if (oldFileName) {
            console.log('[ProfilePictureUpload] Removing old avatar:', oldFileName)
            await supabase.storage
              .from('avatars')
              .remove([oldFileName])
          }
        } catch (deleteError) {
          console.warn('[ProfilePictureUpload] Failed to delete old avatar:', deleteError)
          // Continue with upload even if delete fails
        }
      }

      // Upload new file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('[ProfilePictureUpload] Upload error:', uploadError)
        throw uploadError
      }

      console.log('[ProfilePictureUpload] Upload successful:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('[ProfilePictureUpload] Public URL:', publicUrl)

      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('[ProfilePictureUpload] Database update error:', updateError)
        throw updateError
      }

      console.log('[ProfilePictureUpload] ✅ Profile picture updated successfully')

      toast.success('Profile picture updated successfully!', { id: uploadingToast })
      setPreviewUrl(publicUrl)

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(publicUrl)
      }
    } catch (error) {
      console.error('[ProfilePictureUpload] ❌ Upload failed:', error)
      toast.error(`Failed to upload profile picture: ${error.message}`, { id: uploadingToast })

      // Reset preview on error
      setPreviewUrl(currentAvatarUrl)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!currentAvatarUrl) return

    const removingToast = toast.loading('Removing profile picture...')

    try {
      // Remove from storage
      const fileName = currentAvatarUrl.split('/').pop()
      if (fileName) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([fileName])

        if (deleteError) {
          console.warn('[ProfilePictureUpload] Delete error:', deleteError)
        }
      }

      // Update database to remove avatar_url
      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      toast.success('Profile picture removed', { id: removingToast })
      setPreviewUrl(null)

      if (onUploadSuccess) {
        onUploadSuccess(null)
      }
    } catch (error) {
      console.error('[ProfilePictureUpload] Remove error:', error)
      toast.error('Failed to remove profile picture', { id: removingToast })
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Profile Picture
      </label>

      <div className="flex items-center gap-6">
        {/* Avatar Display */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile picture"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {/* Remove button */}
          {previewUrl && !uploading && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
            id="profile-picture-upload"
            disabled={uploading}
          />

          <label
            htmlFor="profile-picture-upload"
            className={`inline-flex items-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors cursor-pointer ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            {previewUrl ? 'Change Photo' : 'Upload Photo'}
          </label>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• JPG or PNG format</p>
            <p>• Maximum size: 5MB</p>
            <p>• Square images work best</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePictureUpload
