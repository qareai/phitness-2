import { useState, useEffect, useRef } from 'react'
import { initializeChatbot, sendChatMessage, getChatHistory, getSuggestedQuestions, clearChatHistory } from '../utils/friendliAI.js'

function FitnessChatbot() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  useEffect(() => {
    initializeChatbotWithUserData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChatbotWithUserData = () => {
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('stayHardUser') || '{}')
      const setupData = JSON.parse(localStorage.getItem('stayHardSetup') || '{}')
      const statsData = JSON.parse(localStorage.getItem('stayHardStats') || '{}')

      // Initialize chatbot with user profile
      initializeChatbot(userData, setupData, statsData)
      
      // Get suggested questions
      const suggestions = getSuggestedQuestions()
      setSuggestedQuestions(suggestions)
      
      // Load existing conversation history
      const history = getChatHistory()
      setMessages(history)
      
      setIsInitialized(true)

      // Add welcome message if no history
      if (history.length === 0) {
        const userName = userData?.email?.split('@')[0] || 'Champion'
        const welcomeMessage = {
          role: 'assistant',
          content: `Hey ${userName}! 💪 I'm your personal fitness coach AI. I know all about your fitness journey - your ${setupData?.fitnessLevel || 'current'} level, your ${statsData?.streak || 0}-day streak, and your goals. Ask me anything about workouts, nutrition, motivation, or how to make the most of the Stay Hard Reminder app!`,
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error('Failed to initialize chatbot:', error)
      setIsInitialized(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim()
    if (!message || isLoading) return

    setIsLoading(true)
    setInputMessage('')

    // Add user message to UI immediately
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Send message to Friendli.ai
      const response = await sendChatMessage(message)
      
      // Add AI response to UI
      const aiMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        success: response.success
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Chat error:', error)
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 💪",
        timestamp: new Date().toISOString(),
        success: false
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearChatHistory()
      setMessages([])
      initializeChatbotWithUserData() // Reinitialize with welcome message
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isInitialized) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">🤖 Fitness Coach AI</h3>
        <p className="text-gray-400">Initializing your personal fitness coach...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-700 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-lg font-semibold text-white">Fitness Coach AI</h3>
            <p className="text-xs text-gray-400">Powered by Friendli.ai</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearChat}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition duration-200"
            title="Clear chat history"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition duration-200"
          >
            {isOpen ? 'Minimize' : 'Open Chat'}
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {isOpen && (
        <div className="flex flex-col h-96">
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.success === false
                      ? 'bg-red-900 border border-red-700 text-red-200'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-200 px-3 py-2 rounded-lg">
                  <p className="text-sm">Thinking... 🤔</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && suggestedQuestions.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">💡 Try asking:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition duration-200"
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about workouts, nutrition, motivation..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="2"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition duration-200"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed State */}
      {!isOpen && (
        <div className="p-4">
          <p className="text-gray-400 text-sm">
            Chat with your personal fitness coach AI for workout tips, motivation, and guidance! 💪
          </p>
        </div>
      )}
    </div>
  )
}

export default FitnessChatbot
