import { useAuth } from '@contexts/AuthContext'
import { User, Mail, Calendar, Camera, MapPin, Phone } from 'lucide-react'
import Button from '@components/ui/Button'

const Profile = () => {
  const { user, profile, photographerProfile } = useAuth()

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'Not provided'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Full Name
                  </label>
                  <p className="text-foreground">
                    {profile?.full_name || user?.user_metadata?.full_name || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="text-foreground">{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Account Type
                  </label>
                  <p className="text-foreground capitalize">
                    {profile?.role || user?.user_metadata?.role || 'Customer'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Member Since
                  </label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="text-foreground">{formatDate(user?.created_at)}</p>
                  </div>
                </div>

                {profile?.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-foreground">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile?.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Location
                    </label>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-foreground">{profile.location}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button variant="primary" size="md">
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Photographer Profile Section */}
            {photographerProfile && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Photographer Profile
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Business Name
                    </label>
                    <p className="text-foreground">
                      {photographerProfile.business_name || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Specialties
                    </label>
                    <p className="text-foreground">
                      {photographerProfile.specialties?.join(', ') || 'Not provided'}
                    </p>
                  </div>

                  {photographerProfile.bio && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1">
                        Bio
                      </label>
                      <p className="text-foreground">{photographerProfile.bio}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Status
                    </label>
                    <p className="text-foreground capitalize">
                      {photographerProfile.status || 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <Button variant="secondary" size="md">
                    Manage Photographer Profile
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Bookings</span>
                  <span className="font-semibold text-foreground">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Sessions</span>
                  <span className="font-semibold text-foreground">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reviews</span>
                  <span className="font-semibold text-foreground">-</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>

              <div className="text-center text-muted-foreground py-8">
                <p>No recent activity to display</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>

              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  View Dashboard
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Browse Photographers
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile