import { useState, useEffect } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { FileText, Download, Eye, Calendar, MapPin, DollarSign, User, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ContractsPage = () => {
  const { user, photographerProfile } = useAuth()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user && photographerProfile) {
      fetchContracts()
    }
  }, [user, photographerProfile])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[ContractsPage] Fetching contracts for photographer:', photographerProfile.id)

      // Fetch all bookings with signed contracts for this photographer
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id,
          event_date,
          event_time,
          venue_name,
          venue_address,
          total_amount,
          contract_signed_url,
          contract_signed_at,
          customer_id,
          users!bookings_customer_id_fkey (
            full_name,
            email
          ),
          packages (
            title
          )
        `)
        .eq('photographer_id', photographerProfile.id)
        .not('contract_signed_url', 'is', null)
        .order('contract_signed_at', { ascending: false })

      if (fetchError) {
        console.error('[ContractsPage] Error fetching contracts:', fetchError)
        throw new Error('Failed to load contracts')
      }

      console.log('[ContractsPage] Fetched contracts:', data?.length || 0)
      setContracts(data || [])

    } catch (err) {
      console.error('[ContractsPage] Error:', err)
      setError(err.message || 'Failed to load contracts')
      toast.error('Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  const handleViewContract = async (contractUrl) => {
    try {
      // Open PDF in new tab
      window.open(contractUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('[ContractsPage] Error viewing contract:', err)
      toast.error('Failed to open contract')
    }
  }

  const handleDownloadContract = async (contractUrl, bookingId) => {
    try {
      const loadingToast = toast.loading('Downloading contract...')

      // Fetch the PDF
      const response = await fetch(contractUrl)
      if (!response.ok) throw new Error('Failed to download contract')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contract_${bookingId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Contract downloaded', { id: loadingToast })
    } catch (err) {
      console.error('[ContractsPage] Error downloading contract:', err)
      toast.error('Failed to download contract')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatLocation = (venueName, venueAddress) => {
    if (venueName) return venueName
    if (venueAddress) {
      if (typeof venueAddress === 'object') {
        return venueAddress.address || venueAddress.city || 'Location provided'
      }
      return venueAddress
    }
    return 'Location TBD'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Contracts</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchContracts}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <FileText className="w-8 h-8 text-primary-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Signed Contracts</h1>
              <p className="text-gray-600 mt-1">
                View and download signed contracts from your bookings
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-lg font-semibold text-gray-900">{contracts.length}</span>
            <span className="text-gray-600">Contract{contracts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {contracts.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Signed Contracts Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Signed contracts from your bookings will appear here. Once a client signs a contract,
              you'll be able to view and download it.
            </p>
          </div>
        </div>
      )}

      {/* Contracts List */}
      {contracts.length > 0 && (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Contract Header */}
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contract.packages?.title || 'Photography Booking'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Signed on {formatDate(contract.contract_signed_at)}
                      </p>
                    </div>
                  </div>

                  {/* Contract Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Event Date */}
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600 mr-2">Event Date:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(contract.event_date)}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600 mr-2">Location:</span>
                      <span className="font-medium text-gray-900">
                        {formatLocation(contract.venue_name, contract.venue_address)}
                      </span>
                    </div>

                    {/* Client */}
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600 mr-2">Client:</span>
                      <span className="font-medium text-gray-900">
                        {contract.users?.full_name || contract.users?.email || 'Client'}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600 mr-2">Amount:</span>
                      <span className="font-medium text-gray-900">
                        ${parseFloat(contract.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                    Booking ID: {contract.id}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-6">
                  <button
                    onClick={() => handleViewContract(contract.contract_signed_url)}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Contract
                  </button>
                  <button
                    onClick={() => handleDownloadContract(contract.contract_signed_url, contract.id)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContractsPage