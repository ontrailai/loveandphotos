/**
 * usePortfolioUpload Hook
 * Handles batch portfolio photo uploads with progress tracking, resumability, and crash prevention
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@lib/supabase'
import toast from 'react-hot-toast'

const UPLOAD_STORAGE_KEY = 'portfolio_upload_state'
const LARGE_BATCH_THRESHOLD = 25

/**
 * Upload state structure for localStorage persistence
 * @typedef {Object} UploadState
 * @property {string[]} pendingFiles - File names waiting to upload
 * @property {string[]} completedUrls - Successfully uploaded URLs
 * @property {Object[]} failedFiles - Files that failed with error info
 * @property {number} timestamp - When upload started
 */

export const usePortfolioUpload = ({ userId, maxPhotos = 50, minPhotos = 10, onPhotosChange }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState([])
  const [showLargeBatchWarning, setShowLargeBatchWarning] = useState(false)
  const [pendingUploadSession, setPendingUploadSession] = useState(null)
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  const pendingFilesRef = useRef([])
  const uploadAbortRef = useRef(false)

  /**
   * Check for incomplete upload session on mount
   */
  useEffect(() => {
    checkForPendingUploads()
  }, [])

  /**
   * Add beforeunload handler when uploading
   */
  useEffect(() => {
    if (!uploading) return

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Upload in progress. Are you sure you want to leave? Your upload progress will be lost.'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [uploading])

  /**
   * Save upload state to localStorage for resumability
   */
  const saveUploadState = useCallback((state) => {
    try {
      localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify({
        ...state,
        userId,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('[usePortfolioUpload] Failed to save upload state:', error)
    }
  }, [userId])

  /**
   * Clear upload state from localStorage
   */
  const clearUploadState = useCallback(() => {
    try {
      localStorage.removeItem(UPLOAD_STORAGE_KEY)
      setPendingUploadSession(null)
      setShowResumeDialog(false)
    } catch (error) {
      console.error('[usePortfolioUpload] Failed to clear upload state:', error)
    }
  }, [])

  /**
   * Check for pending uploads from previous session
   */
  const checkForPendingUploads = useCallback(() => {
    try {
      const savedState = localStorage.getItem(UPLOAD_STORAGE_KEY)
      if (!savedState) return

      const state = JSON.parse(savedState)

      // Only show resume dialog if state is from same user and less than 1 hour old
      const isRecent = Date.now() - state.timestamp < 3600000 // 1 hour
      const isSameUser = state.userId === userId

      if (isRecent && isSameUser && state.pendingFiles?.length > 0) {
        setPendingUploadSession(state)
        setShowResumeDialog(true)
      } else {
        // Clear stale state
        clearUploadState()
      }
    } catch (error) {
      console.error('[usePortfolioUpload] Failed to check pending uploads:', error)
      clearUploadState()
    }
  }, [userId, clearUploadState])

  /**
   * Upload a single file with retry logic
   */
  const uploadSingleFile = async (file, fileIndex, retryCount = 0) => {
    if (uploadAbortRef.current) {
      throw new Error('Upload cancelled')
    }

    const maxRetries = 3
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    console.log(`[usePortfolioUpload] Uploading ${file.name} (attempt ${retryCount + 1}/${maxRetries + 1})`)

    // Update progress to uploading state
    setUploadProgress(prev => {
      const updated = [...prev]
      updated[fileIndex] = {
        ...updated[fileIndex],
        status: 'uploading',
        progress: 10
      }
      return updated
    })

    try {
      const { error: uploadError } = await supabase.storage
        .from('photographer-portfolios')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Update progress to 50% after upload completes
      setUploadProgress(prev => {
        const updated = [...prev]
        updated[fileIndex] = {
          ...updated[fileIndex],
          progress: 50
        }
        return updated
      })

      const { data: { publicUrl } } = supabase.storage
        .from('photographer-portfolios')
        .getPublicUrl(fileName)

      // Update progress to 100% success
      setUploadProgress(prev => {
        const updated = [...prev]
        updated[fileIndex] = {
          ...updated[fileIndex],
          status: 'success',
          progress: 100
        }
        return updated
      })

      console.log(`[usePortfolioUpload] ✅ ${file.name} uploaded successfully`)
      return { success: true, url: publicUrl, fileName: file.name }

    } catch (error) {
      // Retry with exponential backoff
      if (retryCount < maxRetries && !uploadAbortRef.current) {
        console.warn(`[usePortfolioUpload] Retry ${retryCount + 1}/${maxRetries} for ${file.name}`)

        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))

        return uploadSingleFile(file, fileIndex, retryCount + 1)
      }

      // Mark as failed
      setUploadProgress(prev => {
        const updated = [...prev]
        updated[fileIndex] = {
          ...updated[fileIndex],
          status: 'error',
          progress: 0,
          error: error.message
        }
        return updated
      })

      console.error(`[usePortfolioUpload] ❌ Failed to upload ${file.name}:`, error)
      return { success: false, error: error.message, fileName: file.name }
    }
  }

  /**
   * Batch upload multiple files with Promise.allSettled
   */
  const uploadFiles = useCallback(async (files, existingPhotos = []) => {
    if (!files || files.length === 0) return

    // Validate file count
    if (existingPhotos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed. You can upload ${maxPhotos - existingPhotos.length} more.`)
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
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

    if (validFiles.length === 0) {
      toast.error('No valid files to upload')
      return
    }

    // Show large batch warning
    if (validFiles.length >= LARGE_BATCH_THRESHOLD) {
      setShowLargeBatchWarning(true)
      pendingFilesRef.current = validFiles
      return // Wait for user confirmation
    }

    // Proceed with upload
    await performBatchUpload(validFiles, existingPhotos)
  }, [maxPhotos])

  /**
   * Perform the actual batch upload
   */
  const performBatchUpload = useCallback(async (files, existingPhotos = []) => {
    const uploadingToast = toast.loading(`Uploading ${files.length} photo(s)...`)

    setUploading(true)
    uploadAbortRef.current = false

    // Initialize progress tracking
    const initialProgress = files.map((file, idx) => ({
      id: idx,
      name: file.name,
      status: 'pending',
      progress: 0,
      error: null
    }))
    setUploadProgress(initialProgress)

    // Save initial state for resumability
    saveUploadState({
      pendingFiles: files.map(f => f.name),
      completedUrls: [],
      failedFiles: []
    })

    try {
      // Upload all files with Promise.allSettled for better error handling
      const uploadPromises = files.map((file, idx) => uploadSingleFile(file, idx))
      const results = await Promise.allSettled(uploadPromises)

      // Process results
      const successfulUploads = results
        .filter(r => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value.url)

      const failedUploads = results
        .filter(r => r.status === 'fulfilled' && !r.value.success)
        .map(r => r.value)

      // Update photos if any succeeded
      if (successfulUploads.length > 0) {
        const newPhotos = [...existingPhotos, ...successfulUploads]
        onPhotosChange(newPhotos)
        toast.success(
          `${successfulUploads.length} photo(s) uploaded successfully`,
          { id: uploadingToast }
        )
      }

      // Handle failures
      if (failedUploads.length > 0) {
        const failedNames = failedUploads.map(f => f.fileName).join(', ')
        toast.error(
          `Failed to upload ${failedUploads.length} file(s): ${failedNames}`,
          { id: uploadingToast, duration: 5000 }
        )
      }

      // All failed
      if (successfulUploads.length === 0 && failedUploads.length > 0) {
        toast.error(
          'All uploads failed. Please check your connection and try again.',
          { id: uploadingToast }
        )
      }

      // Clear upload state on completion
      clearUploadState()

    } catch (error) {
      console.error('[usePortfolioUpload] Batch upload error:', error)
      toast.error('Failed to upload photos. Please try again.', { id: uploadingToast })
    } finally {
      setUploading(false)
      setUploadProgress([])
      pendingFilesRef.current = []
    }
  }, [onPhotosChange, saveUploadState, clearUploadState])

  /**
   * Confirm large batch upload
   */
  const confirmLargeBatchUpload = useCallback(async (existingPhotos) => {
    setShowLargeBatchWarning(false)
    await performBatchUpload(pendingFilesRef.current, existingPhotos)
  }, [performBatchUpload])

  /**
   * Cancel large batch upload
   */
  const cancelLargeBatchUpload = useCallback(() => {
    setShowLargeBatchWarning(false)
    pendingFilesRef.current = []
    toast.error('Upload cancelled')
  }, [])

  /**
   * Resume upload from previous session
   */
  const resumeUpload = useCallback(() => {
    // Note: Files cannot be restored from localStorage due to security restrictions
    // User will need to re-select files
    toast.info('Please select your files again to resume the upload')
    setShowResumeDialog(false)
    clearUploadState()
  }, [clearUploadState])

  /**
   * Discard pending upload session
   */
  const discardUpload = useCallback(() => {
    clearUploadState()
    toast.success('Pending upload discarded')
  }, [clearUploadState])

  /**
   * Cancel ongoing upload
   */
  const cancelUpload = useCallback(() => {
    uploadAbortRef.current = true
    setUploading(false)
    setUploadProgress([])
    clearUploadState()
    toast.error('Upload cancelled')
  }, [clearUploadState])

  return {
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
  }
}

export default usePortfolioUpload
