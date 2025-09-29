import { createContext, useContext, useState, useEffect } from 'react'

const ChatContext = createContext()

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  // Load messages from localStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('lp_chat_messages')
    return saved ? JSON.parse(saved) : []
  })
  
  const [isOpen, setIsOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(() => {
    return localStorage.getItem('lp_chat_interacted') === 'true'
  })

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('lp_chat_messages', JSON.stringify(messages.slice(-20))) // Keep last 20 messages
    }
  }, [messages])

  // Save interaction state
  useEffect(() => {
    localStorage.setItem('lp_chat_interacted', hasInteracted)
  }, [hasInteracted])

  // Clear old messages after 24 hours
  useEffect(() => {
    const lastClear = localStorage.getItem('lp_chat_last_clear')
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000
    
    if (!lastClear || now - parseInt(lastClear) > dayInMs) {
      setMessages([])
      localStorage.removeItem('lp_chat_messages')
      localStorage.setItem('lp_chat_last_clear', now)
    }
  }, [])

  const addMessage = (message) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now(),
      timestamp: new Date()
    }])
  }

  const clearMessages = () => {
    setMessages([])
    localStorage.removeItem('lp_chat_messages')
    setHasInteracted(false)
  }

  const value = {
    messages,
    isOpen,
    setIsOpen,
    hasInteracted,
    setHasInteracted,
    addMessage,
    clearMessages
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}