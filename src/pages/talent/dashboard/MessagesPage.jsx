import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { MessageSquare, AlertCircle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const MessagesPage = () => {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMessages = useCallback(async () => {
    if (!user?.id || !profile?.role) {
      console.log('[MessagesPage] No user ID or profile role available')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('[MessagesPage] Fetching messages for user role:', profile.role)

      // Fetch all active company messages where user's role is in the audience array
      const { data, error: fetchError } = await supabase
        .from('company_messages')
        .select('id, title, body, audience, created_at, is_active')
        .eq('is_active', true)
        .contains('audience', [profile.role])
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('[MessagesPage] Error fetching messages:', fetchError)
        throw new Error('Failed to load messages')
      }

      console.log('[MessagesPage] Fetched messages:', data?.length || 0)
      setMessages(data || [])

    } catch (err) {
      console.error('[MessagesPage] Error:', err)
      setError(err.message || 'Failed to load messages')
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.role]) // Only depend on ID and role

  useEffect(() => {
    if (user?.id && profile?.role) {
      fetchMessages()
    }
  }, [user?.id, profile?.role, fetchMessages]) // Include fetchMessages since it's memoized

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Show "New" badge if message is less than 7 days old
    const isNew = diffDays <= 7

    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return { formattedDate, isNew }
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
            <h3 className="text-lg font-semibold text-red-900">Error Loading Messages</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchMessages}
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
              <MessageSquare className="w-8 h-8 text-primary-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Message Center</h1>
              <p className="text-gray-600 mt-1">
                Important updates and announcements from Love & Photos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">{messages.length}</span>
            <span className="text-gray-600">Message{messages.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Company announcements and important updates will appear here. Check back regularly for new messages.
            </p>
          </div>
        </div>
      )}

      {/* Messages List */}
      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((message) => {
            const { formattedDate, isNew } = formatDate(message.created_at)

            return (
              <div
                key={message.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Message Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {message.title}
                      </h3>
                      {isNew && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {message.body}
                </div>

                {/* Audience Badge */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="font-medium">Audience:</span>
                    <div className="ml-2 flex flex-wrap gap-1.5">
                      {message.audience.map((role, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium capitalize"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MessagesPage