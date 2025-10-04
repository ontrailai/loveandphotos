import { useState, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PhotoUploader = ({ userId, existingPhotos = [], onPhotosChange, maxPhotos = 50, minPhotos = 10 }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState([])
  const [photos, setPhotos] = useState(existingPhotos)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState(null)
  const fileInputRef = useRef(null)

  // Calculate if requirements are met
  const hasMinPhotos = photos.length >= minPhotos
  const hasMaxPhotos = photos.length >= maxPhotos

  const uploadPhoto = async (file, retryCount = 0) => {
    const maxRetries = 3
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = fileName

    const startTime = performance.now()
    console.log(`[PhotoUploader] Uploading ${file.name} (attempt ${retryCount + 1}/${maxRetries + 1})`)

    try {
      const { error: uploadError } = await supabase.storage
        .from('photographer-portfolios')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photographer-portfolios')
        .getPublicUrl(filePath)

      const endTime = performance.now()
      console.log(`[PhotoUploader] ✅ ${file.name} uploaded in ${(endTime - startTime).toFixed(2)}ms`)

      return publicUrl
    } catch (error) {
      if (retryCount < maxRetries) {
        console.warn(`[PhotoUploader] Retry ${retryCount + 1}/${maxRetries} for ${file.name}:`, error)
        // Exponential backoff: wait 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        return uploadPhoto(file, retryCount + 1)
      }
      console.error(`[PhotoUploader] ❌ Failed to upload ${file.name} after ${maxRetries + 1} attempts:`, error)
      throw error
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Only JPEG and PNG files are allowed`)
        return false
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File size must be less than 10MB`)
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    const uploadingToast = toast.loading(`Uploading ${validFiles.length} photo(s)...`)
    setUploading(true)
    setUploadProgress(validFiles.map((file, idx) => ({ name: file.name, status: 'uploading', progress: 0 })))

    try {
      // Upload files with Promise.allSettled for better error handling
      const uploadPromises = validFiles.map((file, idx) =>
        uploadPhoto(file)
          .then(url => {
            setUploadProgress(prev => {
              const updated = [...prev]
              updated[idx] = { ...updated[idx], status: 'success', progress: 100 }
              return updated
            })
            return { success: true, url }
          })
          .catch(error => {
            setUploadProgress(prev => {
              const updated = [...prev]
              updated[idx] = { ...updated[idx], status: 'error', progress: 0 }
              return updated
            })
            return { success: false, error, fileName: file.name }
          })
      )

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(r => r.success).map(r => r.url)
      const failedUploads = results.filter(r => !r.success)

      if (successfulUploads.length > 0) {
        const newPhotos = [...photos, ...successfulUploads]
        setPhotos(newPhotos)
        onPhotosChange(newPhotos)
        toast.success(`${successfulUploads.length} photo(s) uploaded successfully`, { id: uploadingToast })
      }

      if (failedUploads.length > 0) {
        const failedNames = failedUploads.map(f => f.fileName).join(', ')
        toast.error(`Failed to upload: ${failedNames}`, { id: uploadingToast, duration: 5000 })
      }

      if (successfulUploads.length === 0 && failedUploads.length > 0) {
        toast.error('All uploads failed. Please check your connection and try again.', { id: uploadingToast })
      }
    } catch (error) {
      console.error('[PhotoUploader] Upload error:', error)
      toast.error('Failed to upload photos. Please try again.', { id: uploadingToast })
    } finally {
      setUploading(false)
      setUploadProgress([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteClick = (photoUrl) => {
    setPhotoToDelete(photoUrl)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!photoToDelete) return

    try {
      // Extract file path from URL
      const urlParts = photoToDelete.split('/photographer-portfolios/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage
          .from('photographer-portfolios')
          .remove([filePath])
      }

      const newPhotos = photos.filter(p => p !== photoToDelete)
      setPhotos(newPhotos)
      onPhotosChange(newPhotos)
      toast.success('Photo removed')
    } catch (error) {
      console.error('Error removing photo:', error)
      toast.error('Failed to remove photo')
    } finally {
      setShowDeleteConfirm(false)
      setPhotoToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setPhotoToDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Portfolio Photos ({photos.length}/{maxPhotos})
        </label>
        {!hasMaxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            aria-label="Upload photos"
            aria-describedby="portfolio-upload-instruction"
          >
            <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
            {uploading ? 'Uploading...' : 'Upload More Photos'}
          </button>
        )}
      </div>

      {/* Portfolio Upload Instruction */}
      <p id="portfolio-upload-instruction" className="text-sm text-gray-500 italic">
        Please upload only wedding or portrait photos. Other images may result in profile rejection.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select photo files"
        aria-describedby="portfolio-upload-instruction"
      />

      {/* Validation Messages */}
      {!hasMinPhotos && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Minimum {minPhotos} photos required</p>
            <p>You need at least {minPhotos} photos to publish your portfolio. Currently have {photos.length}.</p>
          </div>
        </div>
      )}

      {hasMaxPhotos && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Portfolio limit reached</p>
            <p>You've reached the maximum of {maxPhotos} photos. Delete existing photos to upload new ones.</p>
          </div>
        </div>
      )}

      {/* Photo Grid - Only show uploaded photos, no empty slots */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div key={photo} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <img
                src={photo}
                alt={`Portfolio photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDeleteClick(photo)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-red-700 shadow-lg"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">No portfolio photos yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Upload {minPhotos}-{maxPhotos} high-quality photos showcasing your best work
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            aria-describedby="portfolio-upload-instruction"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Your First Photos'}
          </button>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Upload {minPhotos}-{maxPhotos} photos (JPEG or PNG, max 10MB each)</p>
        <p>• Choose your best work that showcases your photography style</p>
        {hasMinPhotos && <p className="text-green-600 font-medium">✓ Minimum requirement met ({photos.length} photos)</p>}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Delete Photo
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this photo? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUploader