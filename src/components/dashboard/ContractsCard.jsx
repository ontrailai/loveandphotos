/**
 * Contracts Card Component
 * Displays signed contract captured during booking flow
 */

import { useState, useEffect } from 'react'
import { FileTextIcon, CheckCircleIcon } from 'lucide-react'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import { supabase } from '@lib/supabase'
import { format } from 'date-fns'
import { populateContractTemplate } from '@lib/contract/contractText'
import toast from 'react-hot-toast'

const ContractsCard = ({ booking }) => {
  const [signedContract, setSignedContract] = useState(null)
  const [contractText, setContractText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSignedContract()
  }, [booking.id])

  const loadSignedContract = async () => {
    try {
      setLoading(true)

      // Fetch signed contract from contract_signatures table
      const { data, error } = await supabase
        .from('contract_signatures')
        .select('signer_full_name, signed_at, event_date, location, package_name, price, contract_version')
        .eq('booking_id', booking.id)
        .order('signed_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // If no contract found, that's okay - show fallback message
        if (error.code === 'PGRST116') {
          setSignedContract(null)
          return
        }
        throw error
      }

      setSignedContract(data)

      // Generate contract text using the stored booking data
      if (data) {
        const bookingData = {
          eventDate: data.event_date,
          location: data.location,
          packageName: data.package_name,
          price: `$${Number(data.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          bookingDate: format(new Date(data.signed_at), 'MM/dd/yyyy')
        }
        const populated = populateContractTemplate(bookingData, data.contract_version)
        setContractText(populated)
      }
    } catch (error) {
      console.error('Error loading signed contract:', error)
      toast.error('Failed to load contract')
    } finally {
      setLoading(false)
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
            <h3 className="font-semibold text-foreground">Signed Contract</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Card>
    )
  }

  // No signed contract found - show fallback message
  if (!signedContract) {
    return (
      <Card>
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Signed Contract</h3>
            <p className="text-sm text-muted-foreground">
              No signed contract found. Please contact support if this is unexpected.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Display signed contract
  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">Signed Contract</h3>
              <Badge variant="success" size="sm">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Signed
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Signed by: <span className="font-medium text-foreground">{signedContract.signer_full_name}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Signed on: {format(new Date(signedContract.signed_at), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Text Display */}
      <div className="mt-4">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
          <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-gray-800">
            {contractText}
          </pre>
        </div>
      </div>
    </Card>
  )
}

export default ContractsCard