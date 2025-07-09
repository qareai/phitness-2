// Friendli.ai chatbot service for Stay Hard Reminder app

class FriendliAIService {
  constructor() {
    this.apiUrl = 'https://api.friendli.ai/dedicated'
    this.conversationHistory = []
    this.userProfile = null
    this.config = this.loadConfig()
  }

  // Load configuration from localStorage
  loadConfig() {
    try {
      const defaultConfig = {
        teamId: '', // <-- Set your Friendli.ai Team ID here
        token: '',  // <-- Set your Friendli.ai API token here
        deploymentId: '' // <-- Set your Friendli.ai deployment ID here
      }

      const savedConfig = localStorage.getItem('friendliAIConfig')
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig)
        // Use saved config only if it has valid credentials, otherwise use defaults
        if (parsedConfig.teamId && parsedConfig.token && parsedConfig.deploymentId) {
          return parsedConfig
        }
      }

      return defaultConfig
    } catch {
      return {
        teamId: '', // <-- Set your Friendli.ai Team ID here
        token: '',  // <-- Set your Friendli.ai API token here
        deploymentId: '' // <-- Set your Friendli.ai deployment ID here
      }
    }
  }

  // Check if API is configured
  isConfigured() {
    const isValid = !!(this.config.teamId && this.config.token && this.config.deploymentId)
    console.log('Friendli.ai Config Check:', {
      teamId: this.config.teamId ? '✓ Set' : '✗ Missing',
      token: this.config.token ? '✓ Set' : '✗ Missing',
      deploymentId: this.config.deploymentId ? '✓ Set' : '✗ Missing',
      isValid
    })
    return isValid
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    localStorage.setItem('friendliAIConfig', JSON.stringify(this.config))
  }

  // Clear localStorage and reload default config
  clearStoredConfig() {
    localStorage.removeItem('friendliAIConfig')
    this.config = this.loadConfig()
    console.log('Cleared localStorage and reloaded config:', this.config)
  }

  // Initialize with user profile data
  initializeWithProfile(userData, setupData, statsData) {
    this.userProfile = {
      email: userData?.email || 'User',
      age: setupData?.age || 'Unknown',
      gender: setupData?.gender || 'Unknown',
      fitnessLevel: setupData?.fitnessLevel || 'Unknown',
      gymLocation: setupData?.gymLocation?.name || 'Unknown',
      workoutTime: setupData?.workoutTime || 'Unknown',
      betAmount: setupData?.betAmount || 0,
      streak: statsData?.streak || 0,
      totalSessions: statsData?.totalSessions || 0,
      walletBalance: statsData?.walletBalance || 0,
      shoppingBalance: statsData?.shoppingBalance || 0
    }

    // Create system prompt based on user profile
    this.systemPrompt = this.createSystemPrompt()
  }

  // Create personalized system prompt
  createSystemPrompt() {
    const profile = this.userProfile
    return `You are a friendly and motivational fitness coach AI for the "Stay Hard Reminder" app. 

USER PROFILE:
- Name: ${profile.email.split('@')[0]}
- Age: ${profile.age}
- Gender: ${profile.gender}
- Fitness Level: ${profile.fitnessLevel}
- Gym: ${profile.gymLocation}
- Workout Time: ${profile.workoutTime}
- Current Streak: ${profile.streak} days
- Total Sessions: ${profile.totalSessions}
- Bet Balance: $${profile.walletBalance}
- Shopping Credits: $${profile.shoppingBalance}

PERSONALITY & TONE:
- Be encouraging, motivational, and supportive
- Use fitness terminology and gym slang appropriately
- Reference their specific profile details when relevant
- Be enthusiastic about their progress and goals
- Provide practical fitness advice
- Keep responses conversational and friendly
- Use emojis occasionally to add personality

KNOWLEDGE AREAS:
- Workout routines and exercises
- Nutrition and diet advice
- Motivation and mindset coaching
- Gym etiquette and tips
- Recovery and rest
- Goal setting and tracking
- The Stay Hard Reminder app features

GUIDELINES:
- Always be positive and encouraging
- Celebrate their achievements (streak, sessions completed)
- Gently motivate them if they're struggling
- Provide specific advice based on their fitness level
- Reference their gym and workout time when giving advice
- Keep responses under 200 words unless they ask for detailed information
- If they ask about app features, explain how the bet system, location tracking, and penalties work

Remember: You're here to help them stay committed to their fitness goals and make the most of the Stay Hard Reminder app!`
  }

  // Send message to Friendli.ai
  async sendMessage(userMessage) {
    try {
      // Check if API is configured
      if (!this.isConfigured()) {
        throw new Error('Friendli.ai API not configured. Please set your Team ID and Token.')
      }

      // Reload config in case it was updated
      this.config = this.loadConfig()

      // Add user message to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      })

      // Prepare messages for API
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        // Include last 10 messages for context
        ...this.conversationHistory.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]

      // Correct Friendli.ai API endpoint format
      const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Friendli-Team': this.config.teamId,
          'Authorization': `Bearer ${this.config.token}`
        },
        body: JSON.stringify({
          model: this.config.deploymentId,
          messages: messages,
          max_tokens: 300,
          temperature: 0.7,
          stream: false
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Friendli.ai API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'

      // Add AI response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      })

      // Keep conversation history manageable (last 20 messages)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20)
      }

      return {
        success: true,
        message: aiResponse,
        conversationId: this.conversationHistory.length
      }

    } catch (error) {
      console.error('Friendli.ai API error:', error)

      // Fallback response based on user profile
      const fallbackResponse = this.generateFallbackResponse()

      return {
        success: false,
        message: fallbackResponse,
        error: error.message
      }
    }
  }

  // Generate fallback response when API fails
  generateFallbackResponse() {
    const profile = this.userProfile
    const userName = profile?.email?.split('@')[0] || 'Champion'

    const fallbackResponses = [
      `Hey ${userName}! 💪 I'm having trouble connecting right now, but I'm here to support your fitness journey! With your ${profile?.fitnessLevel || 'current'} fitness level and ${profile?.streak || 0}-day streak, you're doing amazing!`,

      `${userName}, you're crushing it with ${profile?.totalSessions || 0} total sessions! 🔥 Even though I can't give you a detailed response right now, remember that consistency is key. Keep showing up!`,

      `Stay strong, ${userName}! 💯 Your $${profile?.walletBalance || 0} bet shows you're serious about your goals. I'll be back online soon to help you stay motivated!`,

      `${userName}, I'm temporarily offline but your dedication speaks volumes! 🏋️‍♂️ With your workout time at ${profile?.workoutTime || 'your scheduled time'}, you're building great habits!`
    ]

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
  }

  // Get conversation history
  getConversationHistory() {
    return this.conversationHistory
  }

  // Clear conversation history
  clearConversation() {
    this.conversationHistory = []
  }

  // Get suggested questions based on user profile
  getSuggestedQuestions() {
    const profile = this.userProfile
    const suggestions = [
      "What's the best workout routine for my fitness level?",
      "How can I improve my current streak?",
      "What should I eat before my workout?",
      "Tips for staying motivated when I don't feel like going to the gym?",
      "How can I make the most of my workout time?",
      "What exercises are best for beginners/intermediate/advanced?",
      "How do I track my progress effectively?",
      "What should I do on rest days?"
    ]

    // Customize suggestions based on profile
    if (profile?.fitnessLevel === 'beginner') {
      suggestions.unshift("I'm new to the gym, where should I start?")
    }

    if (profile?.streak > 0) {
      suggestions.unshift(`How can I maintain my ${profile.streak}-day streak?`)
    }

    if (profile?.walletBalance > 0) {
      suggestions.push("How does the bet system help with motivation?")
    }

    return suggestions.slice(0, 6) // Return top 6 suggestions
  }

  // Update user profile (when user changes settings)
  updateProfile(newUserData, newSetupData, newStatsData) {
    this.initializeWithProfile(newUserData, newSetupData, newStatsData)
  }
}

// Export singleton instance
export const friendliAI = new FriendliAIService()

// Utility functions
export const initializeChatbot = (userData, setupData, statsData) => {
  friendliAI.initializeWithProfile(userData, setupData, statsData)
}

export const sendChatMessage = async (message) => {
  return await friendliAI.sendMessage(message)
}

export const getChatHistory = () => {
  return friendliAI.getConversationHistory()
}

export const getSuggestedQuestions = () => {
  return friendliAI.getSuggestedQuestions()
}

export const clearChatHistory = () => {
  friendliAI.clearConversation()
}

export const clearFriendliConfig = () => {
  friendliAI.clearStoredConfig()
}
