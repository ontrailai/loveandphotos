import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { 
  MessageCircle, 
  User, 
  Bot, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@lib/supabaseClient'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'

export default function ChatMonitor() {
  const [conversations, setConversations] = useState([])
  const [unansweredQuestions, setUnansweredQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unanswered, flagged
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [stats, setStats] = useState({
    totalConversations: 0,
    unansweredCount: 0,
    avgResponseTime: 0,
    satisfactionRate: 0
  })

  // Fetch chat data from Supabase
  useEffect(() => {
    fetchChatData()
  }, [filter])

  const fetchChatData = async () => {
    setLoading(true)
    try {
      // Fetch conversations
      let query = supabase
        .from('chat_conversations')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter === 'unanswered') {
        query = query.eq('status', 'unanswered')
      } else if (filter === 'flagged') {
        query = query.eq('flagged', true)
      }

      const { data: convData, error: convError } = await query

      if (convError) throw convError

      setConversations(convData || [])

      // Fetch unanswered questions
      const { data: unansweredData, error: unansweredError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('needs_response', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (unansweredError) throw unansweredError

      setUnansweredQuestions(unansweredData || [])

      // Calculate stats
      calculateStats(convData || [])
    } catch (error) {
      console.error('Error fetching chat data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    const total = data.length
    const unanswered = data.filter(c => c.status === 'unanswered').length
    const avgTime = data.reduce((acc, c) => {
      if (c.response_time) {
        return acc + c.response_time
      }
      return acc
    }, 0) / (data.filter(c => c.response_time).length || 1)
    
    const satisfied = data.filter(c => c.satisfaction === 'positive').length
    const rated = data.filter(c => c.satisfaction).length
    const satisfactionRate = rated > 0 ? (satisfied / rated) * 100 : 0

    setStats({
      totalConversations: total,
      unansweredCount: unanswered,
      avgResponseTime: Math.round(avgTime),
      satisfactionRate: Math.round(satisfactionRate)
    })
  }

  const exportData = () => {
    const dataStr = JSON.stringify({ conversations, unansweredQuestions, stats }, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `chat-export-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const markAsAnswered = async (questionId) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ needs_response: false })
        .eq('id', questionId)

      if (error) throw error

      // Refresh data
      fetchChatData()
    } catch (error) {
      console.error('Error marking as answered:', error)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (searchTerm) {
      return conv.messages?.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chat Monitor</h1>
        <p className="text-muted-foreground">Monitor and manage AI chat conversations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Conversations</p>
              <p className="text-2xl font-bold">{stats.totalConversations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unanswered</p>
              <p className="text-2xl font-bold">{stats.unansweredCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">{stats.avgResponseTime}s</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Satisfaction</p>
              <p className="text-2xl font-bold">{stats.satisfactionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#fe395f]/50"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#fe395f]/50"
          >
            <option value="all">All Conversations</option>
            <option value="unanswered">Unanswered</option>
            <option value="flagged">Flagged</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchChatData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Unanswered Questions Alert */}
      {unansweredQuestions.length > 0 && (
        <Card className="p-4 mb-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Unanswered Questions Requiring Attention
          </h3>
          <div className="space-y-2">
            {unansweredQuestions.slice(0, 5).map((question) => (
              <div 
                key={question.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{question.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(question.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsAnswered(question.id)}
                >
                  Mark Answered
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Conversations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-4">Recent Conversations</h2>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fe395f] mx-auto" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No conversations found
              </Card>
            ) : (
              filteredConversations.map((conv) => (
                <Card
                  key={conv.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {conv.user_id || 'Anonymous'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conv.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {conv.last_message || 'No messages'}
                  </p>
                  {conv.status === 'unanswered' && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                      Needs Response
                    </span>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Selected Conversation Detail */}
        {selectedConversation && (
          <div>
            <h2 className="font-semibold mb-4">Conversation Detail</h2>
            <Card className="p-4 max-h-[600px] overflow-y-auto">
              <div className="space-y-3">
                {selectedConversation.messages?.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.type === 'user' 
                          ? 'bg-[#fe395f] text-white' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {msg.type === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span className="text-xs opacity-75">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}