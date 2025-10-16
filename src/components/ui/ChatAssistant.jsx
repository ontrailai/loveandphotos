import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles,
  Camera,
  Package,
  MapPin,
  DollarSign,
  Calendar,
  HelpCircle,
  ChevronDown
} from 'lucide-react'
import { useLocation } from 'react-router-dom'

// Knowledge Base - Site Structure and Content
const SITE_KNOWLEDGE = {
  routes: {
    photographers: '/photographers',
    video: '/videographers',
    pricing: '/pricing/client',
    guide: '/guide',
    about: '/about',
    contact: '/contact'
  },
  packages: {
    starter: {
      name: 'Starter',
      price: '$149',
      hours: '1 hour',
      photos: '50+ edited photos',
      features: ['Digital gallery', 'Basic retouching', 'Download rights']
    },
    pro: {
      name: 'Pro', 
      price: '$349',
      hours: '3 hours',
      photos: '150+ edited photos',
      features: ['Priority editing', 'Advanced retouching', 'Print rights', 'Online gallery for 1 year']
    },
    luxe: {
      name: 'Luxe',
      price: '$749',
      hours: '6+ hours',
      photos: '400+ edited photos',
      features: ['Same-day sneak peeks', 'Premium retouching', 'Album design credit', 'Lifetime gallery']
    }
  },
  videoAddOns: {
    highlight: {
      name: 'Highlight Reel',
      duration: '3-5 minutes',
      price: '+$500'
    },
    ceremony: {
      name: 'Full Ceremony',
      duration: '30-60 minutes',
      price: '+$750'
    },
    documentary: {
      name: 'Documentary Edit',
      duration: '60-90 minutes', 
      price: '+$1500'
    }
  },
  filters: {
    location: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Orange County'],
    style: ['Candid', 'Posed', 'Artistic', 'Documentary', 'Traditional'],
    specialties: ['Wedding', 'Engagement', 'Elopement', 'Video', 'Drone'],
    gender: ['Male', 'Female', 'Non-binary']
  },
  trust: {
    responseTime: '< 2 hours average',
    acceptanceRate: '92%',
    photographers: '500+',
    bookings: '10,000+',
    satisfaction: '4.9/5 stars'
  }
}

// Predefined responses based on intent
const RESPONSE_TEMPLATES = {
  greeting: [
    "Hi! I'm here to help you find the perfect photographer for your special day. What can I help you with?",
    "Welcome to Love & Photos! I can help you explore packages, find photographers, or answer any questions about our services.",
    "Hello! Ready to capture your perfect moments? I can guide you through our photographers, packages, or booking process."
  ],
  packages: {
    comparison: `Our packages are designed to fit every celebration:

**Starter ($149)** - Perfect for intimate moments
• 1 hour coverage
• 50+ edited photos
• Digital gallery

**Pro ($349)** - Our most popular choice
• 3 hours coverage  
• 150+ edited photos
• Priority editing & print rights

**Luxe ($749)** - The complete experience
• 6+ hours coverage
• 400+ edited photos
• Same-day sneak peeks & lifetime gallery

Which type of event are you planning?`,
    video: `We offer professional video add-ons:

**Highlight Reel** (+$500)
• 3-5 minute cinematic edit
• Perfect for social sharing

**Full Ceremony** (+$750)
• Complete ceremony coverage
• 30-60 minutes

**Documentary Edit** (+$1500)
• Full story of your day
• 60-90 minutes

Many couples choose the Highlight Reel for a beautiful keepsake. Would you like to see videographers in your area?`
  },
  booking: {
    process: `Booking is simple! Here's how:

1. **Browse** photographers at /photographers
2. **Filter** by location, style, and budget
3. **Review** portfolios and packages
4. **Request** to book your favorites
5. **Connect** directly with your photographer

Our photographers typically respond within ${SITE_KNOWLEDGE.trust.responseTime}. Ready to start browsing?`,
    availability: "I can't check real-time availability, but our photographers update their calendars regularly. Simply click 'Check Availability' on any photographer's profile to see their open dates!",
    cancellation: "We understand plans can change. Each photographer sets their own cancellation policy, typically allowing free cancellation up to 30 days before your event. You'll see the specific policy before booking."
  },
  trust: {
    quality: `You're in great hands! Here's why couples trust us:

• **${SITE_KNOWLEDGE.trust.photographers} vetted photographers**
• **${SITE_KNOWLEDGE.trust.satisfaction} average rating**
• **${SITE_KNOWLEDGE.trust.acceptanceRate} acceptance rate**
• **${SITE_KNOWLEDGE.trust.bookings} happy couples**
• **100% satisfaction guarantee**

Every photographer is personally reviewed and insured. Would you like to see our top-rated photographers?`,
    backup: "Great question! All our photographers have backup equipment and many have associate shooters on standby. In the rare case of emergency, we'll help you find a qualified replacement at no extra charge."
  }
}

// Suggestion chips for common queries
const SUGGESTION_CHIPS = [
  { label: "View Packages", icon: Package },
  { label: "Find Photographers", icon: Camera },
  { label: "Video Options", icon: Camera },
  { label: "How It Works", icon: HelpCircle },
  { label: "Pricing Info", icon: DollarSign }
]

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const location = useLocation()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Show greeting after delay on first open
  useEffect(() => {
    if (isOpen && !hasInteracted) {
      setHasInteracted(true)
      setTimeout(() => {
        addBotMessage(RESPONSE_TEMPLATES.greeting[0])
      }, 500)
    }
  }, [isOpen, hasInteracted])

  // Add bot message
  const addBotMessage = (content, chips = []) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'bot',
      content,
      chips,
      timestamp: new Date()
    }])
  }

  // Add user message
  const addUserMessage = (content) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date()
    }])
  }

  // Process user input and generate response
  const processUserInput = useCallback((input) => {
    const lowerInput = input.toLowerCase()
    
    // Check for specific intents
    if (lowerInput.includes('package') || lowerInput.includes('pricing') || lowerInput.includes('cost')) {
      if (lowerInput.includes('video')) {
        return { response: RESPONSE_TEMPLATES.packages.video, chips: [] }
      }
      return { response: RESPONSE_TEMPLATES.packages.comparison, chips: [
        { label: "Book Starter", action: "/photographers" },
        { label: "Book Pro", action: "/photographers" },
        { label: "Book Luxe", action: "/photographers" }
      ]}
    }

    if (lowerInput.includes('how') && (lowerInput.includes('book') || lowerInput.includes('work'))) {
      return { response: RESPONSE_TEMPLATES.booking.process, chips: [
        { label: "Start Browsing", action: "/photographers" },
        { label: "View Guide", action: "/guide" }
      ]}
    }

    if (lowerInput.includes('cancel')) {
      return { response: RESPONSE_TEMPLATES.booking.cancellation, chips: [] }
    }

    if (lowerInput.includes('available') || lowerInput.includes('availability')) {
      return { response: RESPONSE_TEMPLATES.booking.availability, chips: [
        { label: "Browse Photographers", action: "/photographers" }
      ]}
    }

    if (lowerInput.includes('trust') || lowerInput.includes('quality') || lowerInput.includes('guarantee')) {
      return { response: RESPONSE_TEMPLATES.trust.quality, chips: [
        { label: "Top Photographers", action: "/photographers" }
      ]}
    }

    if (lowerInput.includes('backup') || lowerInput.includes('emergency') || lowerInput.includes('sick')) {
      return { response: RESPONSE_TEMPLATES.trust.backup, chips: [] }
    }

    if (lowerInput.includes('female') || lowerInput.includes('woman')) {
      const location = lowerInput.match(/in (\w+)/)?.[1] || ''
      return { 
        response: `I can help you find female photographers${location ? ` in ${location}` : ''}! Visit our photographer search and use the gender filter to see all female photographers. We have many talented women photographers specializing in weddings, engagements, and more.`,
        chips: [{ label: "Find Female Photographers", action: "/photographers" }]
      }
    }

    if (lowerInput.includes('video')) {
      return { 
        response: `Looking for videography? We have amazing videographers who can capture your day in motion. You can browse video specialists or add video to any photo package. What type of video coverage interests you?`,
        chips: [
          { label: "View Videographers", action: "/videographers" },
          { label: "Video Packages", action: "/pricing/client" }
        ]
      }
    }

    // Location-based queries
    const locationMatch = lowerInput.match(/in (los angeles|la|san francisco|sf|san diego|sacramento|orange county)/)
    if (locationMatch) {
      const city = locationMatch[1]
      return {
        response: `Yes! We have fantastic photographers in ${city}. You can filter by location to see all available photographers in your area. Most offer travel within 50 miles at no extra charge.`,
        chips: [{ label: `Browse ${city} Photographers`, action: "/photographers" }]
      }
    }

    // Default helpful response
    return { 
      response: `I'd be happy to help with that! Could you tell me more about what you're looking for? I can help with:
      
• Finding photographers by location or style
• Explaining our packages and pricing
• Video add-on options
• The booking process
• Trust and quality guarantees

What would you like to know more about?`,
      chips: SUGGESTION_CHIPS.map(chip => ({ label: chip.label, action: "/photographers" }))
    }
  }, [])

  // Handle message submission
  const handleSubmit = (e) => {
    e?.preventDefault()
    
    if (!inputValue.trim()) return

    // Add user message
    addUserMessage(inputValue)
    const userInput = inputValue
    setInputValue('')
    
    // Show typing indicator
    setIsTyping(true)
    
    // Simulate processing time
    setTimeout(() => {
      const { response, chips } = processUserInput(userInput)
      setIsTyping(false)
      addBotMessage(response, chips)
    }, 1000 + Math.random() * 1000)
  }

  // Handle suggestion chip click
  const handleChipClick = (chip) => {
    if (chip.action) {
      window.location.href = chip.action
    } else if (chip.label) {
      setInputValue(chip.label)
      handleSubmit()
    }
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-[#fe395f] to-[#ff7a9a] text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300"
            aria-label="Open chat assistant"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline font-medium">Chat with us</span>
            <Sparkles className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#fe395f] to-[#ff7a9a] p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/50 shadow-lg">
                    <img 
                      src="/maskable-icon-512x512.png" 
                      alt="Love & Photos Assistant"
                      className="w-10 h-10 object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold">Love & Photos Assistant</h3>
                  <p className="text-xs text-white/80">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Bot Avatar */}
                  {message.type === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#fe395f]/10 to-[#ff7a9a]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-[#fe395f]/20">
                      <img 
                        src="/favicon-32x32.png" 
                        alt="Love & Photos"
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.type === 'user' 
                    ? 'bg-[#fe395f] text-white rounded-2xl rounded-br-md' 
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-md shadow-sm'
                  } px-4 py-3`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {/* Action Chips */}
                    {message.chips && message.chips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.chips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleChipClick(chip)}
                            className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 justify-start"
                >
                  {/* Bot Avatar for Typing */}
                  <div className="w-8 h-8 bg-gradient-to-br from-[#fe395f]/10 to-[#ff7a9a]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-[#fe395f]/20">
                    <img 
                      src="/favicon-32x32.png" 
                      alt="Love & Photos"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex flex-wrap gap-2">
                  {SUGGESTION_CHIPS.map((chip, idx) => {
                    const Icon = chip.icon
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputValue(chip.label)
                          handleSubmit()
                        }}
                        className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Icon className="h-3 w-3" />
                        {chip.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about packages, photographers..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fe395f]/50 focus:border-[#fe395f]"
                  aria-label="Chat message input"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="p-2.5 bg-[#fe395f] text-white rounded-full hover:bg-[#fe395f]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}