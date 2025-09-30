/**
 * Contracts Card Component
 * Displays contract upload status and provides upload/download actions
 */

import { useState, useEffect } from 'react'
import { FileTextIcon, UploadIcon, DownloadIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon } from 'lucide-react'
import Card from '@components/ui/Card'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import { supabase } from '@lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ContractsCard = ({ booking }) => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadContracts()
  }, [booking.id])

  const loadContracts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('booking_id', booking.id)
        .order('version', { ascending: false })

      if (error) {
        // Silently handle if table doesn't exist yet (404/PGRST205)
        if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message?.includes('schema cache') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setContracts([])
          return
        }
        throw error
      }
      setContracts(data || [])
    } catch (error) {
      console.error('Error loading contracts:', error)
      toast.error('Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }

    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    if (file.size > MAX_SIZE) {
      toast.error('File size must be less than 20MB')
      return
    }

    try {
      setUploading(true)

      // Get upload URL from API
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const uploadUrlResponse = await fetch('/api/contracts/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: booking.id,
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type
        })
      })

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json()
        throw new Error(errorData.message || 'Failed to generate upload URL')
      }

      const { data: uploadData } = await uploadUrlResponse.json()

      // Upload file to Supabase Storage
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Compute file hash
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Finalize contract upload
      const finalizeResponse = await fetch('/api/contracts/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: booking.id,
          storagePath: uploadData.storagePath,
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          sha256Hash
        })
      })

      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json()
        throw new Error(errorData.message || 'Failed to finalize upload')
      }

      toast.success('Contract uploaded successfully!')
      loadContracts() // Reload to show new contract
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload contract')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (contractId) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const response = await fetch(`/api/contracts/${contractId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate download URL')
      }

      const { data } = await response.json()
      window.open(data.downloadUrl, '_blank')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download contract')
    }
  }

  const getStatusBadge = () => {
    if (loading) return null

    const currentContract = contracts.find(c => c.status === 'signed') || contracts[0]

    if (!currentContract) {
      return <Badge variant="warning" size="sm">No Contract</Badge>
    }

    switch (currentContract.status) {
      case 'signed':
        return <Badge variant="success" size="sm">Signed</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pending Signature</Badge>
      case 'superseded':
        return <Badge variant="secondary" size="sm">Superseded</Badge>
      default:
        return <Badge variant="secondary" size="sm">{currentContract.status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Contract</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Card>
    )
  }

  const currentContract = contracts.find(c => c.status === 'signed') || contracts[0]

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">Contract</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentContract ? `Version ${currentContract.version}` : 'No contract uploaded'}
            </p>
          </div>
        </div>
      </div>

      {currentContract && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              {currentContract.status === 'signed' ? (
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
              ) : currentContract.status === 'pending' ? (
                <ClockIcon className="w-4 h-4 text-yellow-600" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 text-gray-600" />
              )}
              <span className="text-muted-foreground">
                {currentContract.filename || `contract-v${currentContract.version}.pdf`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(currentContract.id)}
            >
              <DownloadIcon className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
          {currentContract.uploaded_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Uploaded {format(new Date(currentContract.uploaded_at), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <label className="flex-1">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            as="span"
            variant={currentContract ? "outline" : "primary"}
            size="sm"
            className="w-full cursor-pointer"
            disabled={uploading}
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : currentContract ? 'Upload New Version' : 'Upload Contract'}
          </Button>
        </label>
      </div>

      {contracts.length > 1 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {contracts.length} version{contracts.length > 1 ? 's' : ''} available
          </p>
        </div>
      )}
    </Card>
  )
}

export default ContractsCard