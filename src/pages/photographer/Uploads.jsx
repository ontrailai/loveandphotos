/**
 * Photographer Upload Center Component
 * File upload and delivery management for photographers
 */

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { 
  UploadIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudIcon,
  DownloadIcon,
  AlertCircleIcon,
  ClockIcon,
  DollarSignIcon,
  LinkIcon,
  CopyIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import Input from '@components/ui/Input'
import { supabase, storage } from '@lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const Uploads = () => {
  const { user, photographerProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef(null)
  
  const jobId = searchParams.get('job')
  const bookingId = searchParams.get('booking')
  
  const [currentJob, setCurrentJob] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [overtimeHours, setOvertimeHours] = useState(0)
  const [overtimeRequested, setOvertimeRequested] = useState(false)
  const [deliveryUrl, setDeliveryUrl] = useState('')
  const [deliveryPassword, setDeliveryPassword] = useState('')
  const [recentDeliveries, setRecentDeliveries] = useState([])
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (jobId && bookingId) {
      loadJobDetails()
    }
    loadRecentDeliveries()
  }, [jobId, bookingId])

  const loadJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('job_queue')
        .select(`
          *,
          bookings!inner (
            *,
            customer:users!customer_id (
              full_name,
              email
            ),
            packages (
              title,
              deliverables
            )
          )
        `)
        .eq('id', jobId)
        .single()

      if (error) throw error
      
      setCurrentJob(data)
      setOvertimeRequested(data.overtime_logged || false)
      setDeliveryUrl(data.delivery_url || '')
      
      // Load existing uploads
      if (data.files_uploaded && data.files_uploaded.length > 0) {
        setUploadedFiles(data.files_uploaded)
      }
    } catch (error) {
      console.error('Error loading job details:', error)
      toast.error('Failed to load job details')
    }
  }

  const loadRecentDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('job_queue')
        .select(`
          *,
          bookings!inner (
            event_date,
            customer:users!customer_id (
              full_name
            ),
            packages (
              title
            )
          )
        `)
        .eq('bookings.photographer_id', photographerProfile?.id)
        .eq('upload_status', 'completed')
        .order('delivered_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentDeliveries(data || [])
    } catch (error) {
      console.error('Error loading recent deliveries:', error)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    await uploadFiles(files)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      await uploadFiles(files)
    }
  }

  const uploadFiles = async (files) => {
    if (!currentJob) {
      toast.error('Please select a job first')
      return
    }

    setUploading(true)
    const uploadResults = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(Math.round(((i + 1) / files.length) * 100))

        // Create file path: photographer/booking/filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${file.name}`
        const filePath = `${photographerProfile.id}/${bookingId}/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('deliverables')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('deliverables')
          .getPublicUrl(filePath)

        uploadResults.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          uploaded_at: new Date().toISOString()
        })
      }

      // Update job_queue with new files
      const allFiles = [...uploadedFiles, ...uploadResults]
      
      const { error: updateError } = await supabase
        .from('job_queue')
        .update({
          files_uploaded: allFiles,
          upload_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (updateError) throw updateError

      setUploadedFiles(allFiles)
      toast.success(`${files.length} file(s) uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const generateDeliveryLink = async () => {
    if (!deliveryUrl) {
      toast.error('Please enter a delivery URL')
      return
    }

    try {
      // Generate random password
      const password = Math.random().toString(36).slice(-8)
      
      // Update job queue with delivery details
      const { error } = await supabase
        .from('job_queue')
        .update({
          delivery_url: deliveryUrl,
          delivery_password: password,
          upload_status: 'completed',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error

      setDeliveryPassword(password)
      
      // Send notification email to customer
      await sendDeliveryNotification()
      
      toast.success('Delivery completed and customer notified!')
      
      // Navigate back to job queue after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/photographer/job-queue')
      }, 2000)
    } catch (error) {
      console.error('Error generating delivery:', error)
      toast.error('Failed to generate delivery')
    }
  }

  const sendDeliveryNotification = async () => {
    // This would trigger an edge function or external email service
    try {
      const { error } = await supabase.functions.invoke('send-delivery-email', {
        body: {
          to: currentJob.bookings.customer.email,
          customerName: currentJob.bookings.customer.full_name,
          deliveryUrl: deliveryUrl,
          deliveryPassword: deliveryPassword,
          packageTitle: currentJob.bookings.packages.title,
          eventDate: currentJob.bookings.event_date
        }
      })
      
      if (error) console.error('Email error:', error)
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  }

  const logOvertimeHours = async () => {
    if (overtimeHours <= 0) {
      toast.error('Please enter valid overtime hours')
      return
    }

    try {
      // Create overtime request
      const { error } = await supabase
        .from('overtime_requests')
        .insert({
          job_queue_id: jobId,
          photographer_id: photographerProfile.id,
          booking_id: bookingId,
          hours: overtimeHours,
          hourly_rate: photographerProfile.pay_tiers?.hourly_rate || 150,
          total_amount: overtimeHours * (photographerProfile.pay_tiers?.hourly_rate || 150),
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      // Update job queue
      await supabase
        .from('job_queue')
        .update({
          overtime_logged: overtimeHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      setOvertimeRequested(true)
      toast.success(`${overtimeHours} overtime hours logged for billing`)
    } catch (error) {
      console.error('Error logging overtime:', error)
      toast.error('Failed to log overtime')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-dusty-900">
                Upload Center
              </h1>
              <p className="text-dusty-600 mt-1">
                Deliver photos and videos to your clients
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard/photographer/job-queue')}>
              Back to Job Queue
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentJob ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Info */}
              <Card className="bg-gradient-to-br from-blush-50 to-sage-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-dusty-900">
                      {currentJob.bookings.customer.full_name}
                    </h3>
                    <p className="text-sm text-dusty-600">
                      {currentJob.bookings.packages.title} • {format(new Date(currentJob.bookings.event_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant="warning">
                    Upload in Progress
                  </Badge>
                </div>
              </Card>

              {/* Upload Area */}
              <Card>
                <h3 className="text-lg font-semibold text-dusty-900 mb-4">
                  Upload Files
                </h3>
                
                <div
                  className={clsx(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
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
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <CloudIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  
                  {uploading ? (
                    <div>
                      <p className="text-dusty-600 mb-2">Uploading...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blush-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-dusty-600 mt-2">{uploadProgress}% complete</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-dusty-900 font-medium mb-2">
                        Drag & drop files here or
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Browse Files
                      </Button>
                      <p className="text-sm text-dusty-600 mt-2">
                        Supported: JPG, PNG, MP4, MOV (Max 500MB per file)
                      </p>
                    </>
                  )}
                </div>
              </Card>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-dusty-900 mb-4">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {file.type?.startsWith('image') ? (
                            <ImageIcon className="w-5 h-5 text-blue-500" />
                          ) : file.type?.startsWith('video') ? (
                            <VideoIcon className="w-5 h-5 text-purple-500" />
                          ) : (
                            <FileIcon className="w-5 h-5 text-gray-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-dusty-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-dusty-600">
                              {formatFileSize(file.size)} • Uploaded {format(new Date(file.uploaded_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Delivery Link */}
              <Card>
                <h3 className="text-lg font-semibold text-dusty-900 mb-4">
                  Delivery Method
                </h3>
                
                <div className="space-y-4">
                  <Input
                    label="Gallery/Download Link"
                    placeholder="https://gallery.example.com/client-name"
                    value={deliveryUrl}
                    onChange={(e) => setDeliveryUrl(e.target.value)}
                  />
                  
                  {deliveryPassword && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-900 mb-2">
                        Delivery Details (sent to client)
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">URL:</span>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-white px-2 py-1 rounded">
                              {deliveryUrl}
                            </code>
                            <button onClick={() => copyToClipboard(deliveryUrl)}>
                              <CopyIcon className="w-4 h-4 text-green-600" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">Password:</span>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-white px-2 py-1 rounded">
                              {deliveryPassword}
                            </code>
                            <button onClick={() => copyToClipboard(deliveryPassword)}>
                              <CopyIcon className="w-4 h-4 text-green-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={generateDeliveryLink}
                    className="w-full"
                    disabled={!deliveryUrl || uploadedFiles.length === 0}
                  >
                    Complete Delivery & Notify Client
                  </Button>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Overtime Logging */}
              <Card className="border-yellow-200 bg-yellow-50">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                  Log Overtime
                </h3>
                
                {overtimeRequested ? (
                  <div className="text-center py-4">
                    <CheckCircleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                    <p className="text-yellow-900 font-medium">
                      {overtimeHours} hours logged
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Billing notification sent
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-yellow-800">
                      Did you work beyond the scheduled time?
                    </p>
                    <Input
                      type="number"
                      placeholder="Hours worked overtime"
                      value={overtimeHours}
                      onChange={(e) => setOvertimeHours(parseFloat(e.target.value))}
                      min="0"
                      step="0.5"
                    />
                    <Button 
                      onClick={logOvertimeHours}
                      variant="secondary"
                      className="w-full"
                      disabled={overtimeHours <= 0}
                    >
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Submit Overtime
                    </Button>
                  </div>
                )}
              </Card>

              {/* Package Deliverables */}
              {currentJob?.bookings?.packages?.deliverables && (
                <Card>
                  <h3 className="text-lg font-semibold text-dusty-900 mb-4">
                    Expected Deliverables
                  </h3>
                  <div className="space-y-2">
                    {currentJob.bookings.packages.deliverables.map((item, index) => (
                      <div key={index} className="flex items-center text-sm text-dusty-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                        {item}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recent Deliveries */}
              {recentDeliveries.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-dusty-900 mb-4">
                    Recent Deliveries
                  </h3>
                  <div className="space-y-3">
                    {recentDeliveries.map((delivery) => (
                      <div key={delivery.id} className="text-sm">
                        <p className="font-medium text-dusty-900">
                          {delivery.bookings.customer.full_name}
                        </p>
                        <p className="text-dusty-600">
                          {format(new Date(delivery.delivered_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* No Job Selected */
          <Card className="text-center py-12">
            <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dusty-900 mb-2">
              No Job Selected
            </h3>
            <p className="text-dusty-600 mb-6">
              Select a job from your queue to start uploading
            </p>
            <Button onClick={() => navigate('/dashboard/photographer/job-queue')}>
              Go to Job Queue
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Uploads
