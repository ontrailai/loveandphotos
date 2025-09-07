/**
 * UploadForm Component
 * Reusable file upload form with drag-and-drop
 */

import { useState, useRef } from 'react'
import { 
  CloudIcon, 
  FileIcon, 
  ImageIcon, 
  VideoIcon, 
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UploadIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import { clsx } from 'clsx'

const UploadForm = ({
  onUpload,
  accept = 'image/*,video/*',
  multiple = true,
  maxSize = 500 * 1024 * 1024, // 500MB default
  maxFiles = 100,
  uploading = false,
  uploadProgress = 0,
  className = '',
  showPreview = true
}) => {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [errors, setErrors] = useState([])
  const [previews, setPreviews] = useState([])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (files) => {
    const validFiles = []
    const newErrors = []
    const newPreviews = []

    files.forEach(file => {
      // Check file size
      if (file.size > maxSize) {
        newErrors.push(`${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`)
        return
      }

      // Check file count
      if (validFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`)
        return
      }

      validFiles.push(file)

      // Generate preview for images
      if (showPreview && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          newPreviews.push({
            file: file.name,
            url: e.target.result
          })
          setPreviews(prev => [...prev, {
            file: file.name,
            url: e.target.result
          }])
        }
        reader.readAsDataURL(file)
      }
    })

    setErrors(newErrors)
    setSelectedFiles(validFiles)
    
    if (validFiles.length > 0 && onUpload) {
      onUpload(validFiles)
    }
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />
    if (file.type.startsWith('video/')) return <VideoIcon className="w-5 h-5 text-purple-500" />
    return <FileIcon className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className={className}>
      {/* Upload Zone */}
      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
          dragActive ? 'border-blush-500 bg-blush-50' : 'border-gray-300 hover:border-gray-400',
          uploading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <CloudIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        {uploading ? (
          <div>
            <p className="text-dusty-600 mb-2">Uploading...</p>
            <div className="max-w-xs mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blush-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-dusty-600 mt-2">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-dusty-900 font-medium mb-2">
              {dragActive ? 'Drop files here' : 'Drag & drop files here or'}
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <UploadIcon className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
            <p className="text-sm text-dusty-600 mt-2">
              Max {formatFileSize(maxSize)} per file • {multiple ? `Up to ${maxFiles} files` : 'Single file'}
            </p>
          </>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 mb-1">Upload Errors</p>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="mt-4">
          <h4 className="font-medium text-dusty-900 mb-3">
            Selected Files ({selectedFiles.length})
          </h4>
          
          {showPreview && previews.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview.url}
                    alt={preview.file}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XIcon className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-dusty-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-dusty-600">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadForm
