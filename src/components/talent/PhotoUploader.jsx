import { useState, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePortfolioUpload } from '@hooks/usePortfolioUpload'

const PhotoUploader = ({ userId, existingPhotos = [], onPhotosChange, maxPhotos = 50, minPhotos = 10 }) => {
  const [photos, setPhotos] = useState(existingPhotos)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState(null)
  const fileInputRef = useRef(null)

  // Use the portfolio upload hook
  const {
    uploading,
    uploadProgress,
    uploadFiles,
    showLargeBatchWarning,
    confirmLargeBatchUpload,
    cancelLargeBatchUpload,
    showResumeDialog,
    pendingUploadSession,
    resumeUpload,
    discardUpload,
    cancelUpload
  } = usePortfolioUpload({
    userId,
    maxPhotos,
    minPhotos,
    onPhotosChange: (newPhotos) => {
      setPhotos(newPhotos)
      onPhotosChange(newPhotos)
    }
  })

  // Calculate if requirements are met
  const hasMinPhotos = photos.length >= minPhotos
  const hasMaxPhotos = photos.length >= maxPhotos

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Upload files using the hook
    await uploadFiles(files, photos)

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

      {/* Upload Progress Indicator */}
      {uploading && uploadProgress.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-900">
              Uploading {uploadProgress.length} photo(s)...
            </h4>
            <button
              type="button"
              onClick={cancelUpload}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadProgress.map((file, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-2 bg-white rounded border border-blue-100">
                <div className="flex-shrink-0">
                  {file.status === 'uploading' && <Loader className="w-4 h-4 text-blue-500 animate-spin" />}
                  {file.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {file.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                  {file.status === 'pending' && <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{file.name}</p>
                  {file.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  {file.status === 'error' && (
                    <p className="text-xs text-red-600 mt-0.5">{file.error || 'Upload failed'}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-xs text-gray-500">
                  {file.status === 'success' && '100%'}
                  {file.status === 'uploading' && `${file.progress}%`}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-blue-700 mt-3">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Do not close or refresh this page until all uploads complete.
          </p>
        </div>
      )}

      {/* Large Batch Warning Modal */}
      {showLargeBatchWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Large Upload Detected
                </h3>
                <p className="text-sm text-gray-600">
                  You're about to upload 25+ images. This may take a few minutes. Please stay on this page until the upload completes.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800">
                <strong>Tips for large uploads:</strong>
              </p>
              <ul className="text-xs text-amber-700 mt-1 ml-4 space-y-1 list-disc">
                <li>Keep this browser tab active</li>
                <li>Ensure stable internet connection</li>
                <li>Do not navigate away or refresh</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelLargeBatchUpload}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmLargeBatchUpload(photos)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Continue Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Upload Dialog */}
      {showResumeDialog && pendingUploadSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Resume Upload?
                </h3>
                <p className="text-sm text-gray-600">
                  You had an upload in progress before refreshing. Would you like to resume or discard it?
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> You'll need to re-select your files to resume the upload.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={discardUpload}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={resumeUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Resume Upload
              </button>
            </div>
          </div>
        </div>
      )}

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