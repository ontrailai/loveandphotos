import { useState, useEffect } from 'react'
import { Crown, Star, Trophy, Award, CheckCircle, Lock, TrendingUp, Users, Zap, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const TalentPayTiers = () => {
  const [payTiers, setPayTiers] = useState([])
  const [currentPhotographer, setCurrentPhotographer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, profile } = useAuth()

  // Fetch pay tiers and current photographer data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch pay tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('pay_tiers')
          .select('*')
          .order('hourly_rate', { ascending: true })

        if (tiersError) {
          throw tiersError
        }

        setPayTiers(tiersData || [])

        // Fetch current photographer's tier information
        if (user && profile?.role === 'photographer') {
          const { data: photographerData, error: photographerError } = await supabase
            .from('photographers')
            .select('pay_tier_id, completed_jobs_count, average_rating')
            .eq('user_id', user.id)
            .single()

          if (photographerError && photographerError.code !== 'PGRST116') {
            console.warn('Error fetching photographer data:', photographerError)
          } else if (photographerData) {
            setCurrentPhotographer(photographerData)
          }
        }
      } catch (err) {
        console.error('Error fetching pay tier data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, profile])

  // Get icon for tier
  const getTierIcon = (tierName, isCurrentTier) => {
    const iconProps = {
      className: `w-6 h-6 ${isCurrentTier ? 'text-white' : 'text-muted-foreground'}`,
      'aria-hidden': 'true'
    }

    switch (tierName.toLowerCase()) {
      case 'bronze':
        return <Award {...iconProps} style={{ color: isCurrentTier ? '#fff' : '#CD7F32' }} />
      case 'silver':
        return <Star {...iconProps} style={{ color: isCurrentTier ? '#fff' : '#C0C0C0' }} />
      case 'gold':
        return <Trophy {...iconProps} style={{ color: isCurrentTier ? '#fff' : '#FFD700' }} />
      case 'platinum':
        return <Crown {...iconProps} style={{ color: isCurrentTier ? '#fff' : '#E5E4E2' }} />
      default:
        return <Sparkles {...iconProps} />
    }
  }

  // Get tier color classes
  const getTierColors = (tierName, isCurrentTier) => {
    if (isCurrentTier) {
      return 'bg-primary border-primary text-white'
    }

    switch (tierName.toLowerCase()) {
      case 'bronze':
        return 'bg-card border-amber-200 hover:border-amber-300'
      case 'silver':
        return 'bg-card border-gray-200 hover:border-gray-300'
      case 'gold':
        return 'bg-card border-yellow-200 hover:border-yellow-300'
      case 'platinum':
        return 'bg-card border-purple-200 hover:border-purple-300'
      default:
        return 'bg-card border-border hover:border-primary/30'
    }
  }

  // Check if user is eligible for tier
  const isEligibleForTier = (tier) => {
    if (!currentPhotographer) return false
    
    const completedJobs = currentPhotographer.completed_jobs_count || 0
    const rating = parseFloat(currentPhotographer.average_rating || 0)
    
    // Basic eligibility check based on jobs completed
    return completedJobs >= (tier.min_jobs_required || 0)
  }

  // Get upgrade requirements text
  const getRequirementsText = (tier) => {
    const minJobs = tier.min_jobs_required || 0
    if (minJobs === 0) {
      return 'No requirements - Starting tier'
    }
    return `${minJobs}+ completed jobs required`
  }

  // Get benefit badge text
  const getBenefitBadge = (tier, isCurrentTier) => {
    if (isCurrentTier) {
      return { text: 'Current Tier', color: 'bg-white/20 text-white' }
    }
    
    if (isEligibleForTier(tier)) {
      return { text: 'Eligible', color: 'bg-green-100 text-green-800' }
    }
    
    return { text: 'Locked', color: 'bg-gray-100 text-gray-600' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading pay tiers...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-2">Failed to load pay tier information</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    )
  }

  const currentTierData = payTiers.find(tier => tier.id === currentPhotographer?.pay_tier_id)

  return (
    <div className="space-y-8">
      {/* Current Tier Status */}
      {currentPhotographer && currentTierData && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getTierIcon(currentTierData.name, false)}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Your Current Tier</h3>
                <p className="text-2xl font-bold text-primary">{currentTierData.name}</p>
                <p className="text-sm text-muted-foreground">
                  ${parseFloat(currentTierData.hourly_rate).toLocaleString()}/hour • {currentPhotographer.completed_jobs_count || 0} jobs completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-600 mb-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Active</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentPhotographer.average_rating ? `${parseFloat(currentPhotographer.average_rating).toFixed(1)} ⭐ rating` : 'No rating yet'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Tiers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {payTiers.map((tier) => {
          const isCurrentTier = tier.id === currentPhotographer?.pay_tier_id
          const eligible = isEligibleForTier(tier)
          const benefit = getBenefitBadge(tier, isCurrentTier)
          const hourlyRate = parseFloat(tier.hourly_rate)
          const commission = parseFloat(tier.commission_percentage || 20)

          return (
            <div
              key={tier.id}
              className={`relative rounded-xl border-2 p-6 transition-all hover:shadow-lg ${getTierColors(tier.name, isCurrentTier)} ${
                isCurrentTier ? 'shadow-lg scale-105' : ''
              }`}
              role="article"
              aria-label={`${tier.name} tier - $${hourlyRate.toLocaleString()} per hour`}
            >
              {/* Tier Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${benefit.color}`}>
                  {benefit.text}
                </span>
              </div>

              {/* Tier Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  {getTierIcon(tier.name, isCurrentTier)}
                </div>
                <h3 className={`text-xl font-bold mb-1 ${isCurrentTier ? 'text-white' : 'text-foreground'}`}>
                  {tier.name}
                </h3>
                <div className={`text-3xl font-bold ${isCurrentTier ? 'text-white' : 'text-foreground'}`}>
                  ${hourlyRate.toLocaleString()}
                  <span className={`text-sm font-normal ${isCurrentTier ? 'text-white/80' : 'text-muted-foreground'}`}>
                    /hour
                  </span>
                </div>
                <div className={`text-xs ${isCurrentTier ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {commission}% platform fee
                </div>
              </div>

              {/* Requirements */}
              <div className="mb-4">
                <div className={`text-sm font-medium mb-2 ${isCurrentTier ? 'text-white' : 'text-foreground'}`}>
                  Requirements:
                </div>
                <div className={`text-sm ${isCurrentTier ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {getRequirementsText(tier)}
                </div>
              </div>

              {/* Perks */}
              <div className="mb-6">
                <div className={`text-sm font-medium mb-3 ${isCurrentTier ? 'text-white' : 'text-foreground'}`}>
                  Benefits:
                </div>
                <ul className="space-y-2">
                  {tier.perks?.map((perk, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                        isCurrentTier ? 'text-white' : 'text-primary'
                      }`} />
                      <span className={`text-sm ${isCurrentTier ? 'text-white/90' : 'text-foreground'}`}>
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <div className="text-center">
                {isCurrentTier ? (
                  <div className={`text-sm font-medium py-2 ${isCurrentTier ? 'text-white' : 'text-primary'}`}>
                    ✓ Your Current Tier
                  </div>
                ) : eligible ? (
                  <button 
                    className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    aria-label={`Upgrade to ${tier.name} tier`}
                  >
                    Upgrade Now
                  </button>
                ) : (
                  <div className="flex items-center justify-center text-muted-foreground text-sm py-2">
                    <Lock className="w-4 h-4 mr-1" />
                    Not Eligible Yet
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Detailed Comparison</h3>
          <p className="text-sm text-muted-foreground">Compare all features across pay tiers</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Pay tier comparison table">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-foreground" scope="col">Feature</th>
                {payTiers.map((tier) => (
                  <th 
                    key={tier.id} 
                    className={`text-center p-4 font-semibold ${
                      tier.id === currentPhotographer?.pay_tier_id ? 'bg-primary/10 text-primary' : 'text-foreground'
                    }`}
                    scope="col"
                  >
                    {tier.name}
                    {tier.id === currentPhotographer?.pay_tier_id && (
                      <div className="text-xs font-normal text-primary/80 mt-1">Current</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="p-4 font-medium text-foreground">Hourly Rate</td>
                {payTiers.map((tier) => (
                  <td 
                    key={tier.id} 
                    className={`text-center p-4 ${
                      tier.id === currentPhotographer?.pay_tier_id ? 'bg-primary/5 font-bold text-primary' : 'text-foreground'
                    }`}
                  >
                    ${parseFloat(tier.hourly_rate).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-4 font-medium text-foreground">Min. Jobs Required</td>
                {payTiers.map((tier) => (
                  <td 
                    key={tier.id} 
                    className={`text-center p-4 ${
                      tier.id === currentPhotographer?.pay_tier_id ? 'bg-primary/5' : ''
                    } text-muted-foreground`}
                  >
                    {tier.min_jobs_required || 0}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-4 font-medium text-foreground">Platform Fee</td>
                {payTiers.map((tier) => (
                  <td 
                    key={tier.id} 
                    className={`text-center p-4 ${
                      tier.id === currentPhotographer?.pay_tier_id ? 'bg-primary/5' : ''
                    } text-muted-foreground`}
                  >
                    {tier.commission_percentage || 20}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-foreground">Benefits Count</td>
                {payTiers.map((tier) => (
                  <td 
                    key={tier.id} 
                    className={`text-center p-4 ${
                      tier.id === currentPhotographer?.pay_tier_id ? 'bg-primary/5' : ''
                    } text-muted-foreground`}
                  >
                    {tier.perks?.length || 0} features
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Path Information */}
      {currentPhotographer && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <TrendingUp className="w-6 h-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Upgrade Path</h3>
              <p className="text-gray-700 mb-4">
                You've completed {currentPhotographer.completed_jobs_count || 0} jobs. 
                {currentPhotographer.average_rating && (
                  <span> Your current rating is {parseFloat(currentPhotographer.average_rating).toFixed(1)} ⭐.</span>
                )}
              </p>
              
              {/* Next tier info */}
              {(() => {
                const nextTier = payTiers.find(tier => 
                  tier.min_jobs_required > (currentPhotographer.completed_jobs_count || 0)
                )
                
                if (nextTier) {
                  const jobsNeeded = nextTier.min_jobs_required - (currentPhotographer.completed_jobs_count || 0)
                  return (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="font-medium text-gray-900 mb-1">
                        Next: {nextTier.name} Tier
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Complete {jobsNeeded} more job{jobsNeeded !== 1 ? 's' : ''} to unlock ${parseFloat(nextTier.hourly_rate).toLocaleString()}/hour
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((currentPhotographer.completed_jobs_count || 0) / nextTier.min_jobs_required) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center text-green-600">
                        <Crown className="w-5 h-5 mr-2" />
                        <span className="font-medium">You've reached the highest tier!</span>
                      </div>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TalentPayTiers