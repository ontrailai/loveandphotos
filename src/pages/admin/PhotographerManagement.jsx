import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircleIcon,
  XCircleIcon,
  Award,
  Search,
  Filter
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Input from '@components/ui/Input'
import LNPChoiceBadge from '@components/ui/LNPChoiceBadge'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import toast from 'react-hot-toast'

const PhotographerManagement = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [photographers, setPhotographers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLNP, setFilterLNP] = useState('all') // all, lnp, non-lnp

  useEffect(() => {
    // Check if user is admin
    if (profile?.role !== 'admin') {
      toast.error('Admin access required')
      navigate('/dashboard')
      return
    }

    loadPhotographers()
  }, [profile])

  const loadPhotographers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('photographers')
        .select(`
          *,
          users (
            id,
            full_name,
            email
          ),
          pay_tiers (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotographers(data || [])
    } catch (error) {
      console.error('Error loading photographers:', error)
      toast.error('Failed to load photographers')
    } finally {
      setLoading(false)
    }
  }

  const toggleLNPChoice = async (photographerId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('photographers')
        .update({ is_lnp_choice: !currentStatus })
        .eq('id', photographerId)

      if (error) throw error

      toast.success(
        currentStatus 
          ? 'Removed from Love & Photo\'s Choice' 
          : 'Added to Love & Photo\'s Choice'
      )
      
      // Reload photographers
      await loadPhotographers()
    } catch (error) {
      console.error('Error updating LNP Choice:', error)
      toast.error('Failed to update LNP Choice status')
    }
  }

  // Filter photographers based on search and LNP filter
  const filteredPhotographers = photographers.filter(p => {
    const matchesSearch = !searchTerm || 
      p.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLNP = 
      filterLNP === 'all' ||
      (filterLNP === 'lnp' && p.is_lnp_choice) ||
      (filterLNP === 'non-lnp' && !p.is_lnp_choice)
    
    return matchesSearch && matchesLNP
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading photographers...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dusty-900 mb-2">
          Photographer Management
        </h1>
        <p className="text-dusty-600">
          Manage photographer profiles and Love & Photo's Choice selections
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={<Search className="w-5 h-5" />}
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterLNP === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilterLNP('all')}
            >
              All ({photographers.length})
            </Button>
            <Button
              variant={filterLNP === 'lnp' ? 'primary' : 'outline'}
              onClick={() => setFilterLNP('lnp')}
            >
              LNP Choice ({photographers.filter(p => p.is_lnp_choice).length})
            </Button>
            <Button
              variant={filterLNP === 'non-lnp' ? 'primary' : 'outline'}
              onClick={() => setFilterLNP('non-lnp')}
            >
              Non-LNP ({photographers.filter(p => !p.is_lnp_choice).length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Photographer List */}
      <div className="grid gap-4">
        {filteredPhotographers.map(photographer => (
          <Card key={photographer.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-dusty-900">
                    {photographer.users?.full_name || 'Unknown'}
                  </h3>
                  {photographer.is_lnp_choice && <LNPChoiceBadge size="small" />}
                  <span className="text-sm text-dusty-600">
                    ({photographer.pay_tiers?.name || 'No tier'})
                  </span>
                </div>
                <p className="text-sm text-dusty-600">
                  {photographer.users?.email || 'No email'}
                </p>
                <div className="flex gap-4 mt-2 text-sm text-dusty-600">
                  <span>Rating: {photographer.average_rating || 0}/5</span>
                  <span>Reviews: {photographer.total_reviews || 0}</span>
                  <span>Jobs: {photographer.completed_jobs_count || 0}</span>
                  {photographer.is_verified && (
                    <span className="text-green-600">✓ Verified</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={photographer.is_lnp_choice ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => toggleLNPChoice(photographer.id, photographer.is_lnp_choice)}
                >
                  {photographer.is_lnp_choice ? (
                    <>
                      <XCircleIcon className="w-4 h-4 mr-2" />
                      Remove LNP Choice
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 mr-2" />
                      Add LNP Choice
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Future Automation Info */}
            {photographer.pay_tier_id >= 3 && 
             photographer.average_rating >= 4.5 && 
             photographer.total_reviews >= 10 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-dusty-500">
                  ℹ️ Qualifies for automatic LNP Choice based on: 
                  {photographer.pay_tier_id >= 3 && ' Gold/Platinum tier,'}
                  {photographer.average_rating >= 4.5 && ' 4.5+ rating,'}
                  {photographer.total_reviews >= 10 && ' 10+ reviews'}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredPhotographers.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-dusty-600">No photographers found matching your criteria</p>
        </Card>
      )}
    </div>
  )
}

export default PhotographerManagement