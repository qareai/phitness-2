// Retell AI integration for motivational calls

class RetellAIService {
  constructor() {
    // Provide your Retell AI credentials securely (e.g., via environment variables)
    this.apiKey = '' // <-- Set your Retell AI API key here
    this.agentId = '' // <-- Set your Retell AI agent ID here
    this.conversationFlowId = '' // <-- Set your Retell AI conversation flow ID here if needed
    this.baseUrl = 'https://api.retellai.com/v2'
  }

  // Create a phone call through Retell AI
  async createCall(phoneNumber, userContext = {}) {
    try {
      // Start with minimal required fields based on SDK example
      const callData = {
        from_number: '+17692481842', // Your Retell number
        to_number: phoneNumber,
        agent_id: this.agentId
      }

      // Add optional fields if needed
      if (Object.keys(userContext).length > 0) {
        callData.metadata = {
          user_name: userContext.userName || 'User',
          missed_workouts: userContext.missedWorkouts || 1,
          streak_before: userContext.streakBefore || 0,
          bet_amount: userContext.betAmount || 50,
          gym_name: userContext.gymName || 'your gym',
          workout_time: userContext.workoutTime || 'workout time',
          call_reason: 'missed_workout_motivation',
          timestamp: new Date().toISOString()
        }

        // Dynamic variables for the AI agent
        callData.retell_llm_dynamic_variables = {
          user_name: userContext.userName || 'User',
          gym_name: userContext.gymName || 'your gym',
          bet_amount: userContext.betAmount?.toString() || '50',
          streak_lost: userContext.streakBefore?.toString() || '0',
          motivational_context: this.generateMotivationalContext(userContext)
        }
      }

      console.log('Sending Retell AI request:', {
        url: `${this.baseUrl}/create-phone-call`,
        data: callData
      })

      const response = await fetch(`${this.baseUrl}/create-phone-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Retell AI API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: response.url
        })
        throw new Error(`Retell AI API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Retell AI Call Created Successfully:', result)

      // Log the call attempt
      this.logCallAttempt(phoneNumber, userContext, result)

      return {
        success: true,
        callId: result.call_id,
        status: result.call_status,
        message: 'Motivational call initiated successfully'
      }
    } catch (error) {
      console.error('Failed to create Retell AI call:', error)

      // Log the failed attempt
      this.logCallAttempt(phoneNumber, userContext, null, error.message)

      return {
        success: false,
        error: error.message,
        message: 'Failed to initiate motivational call'
      }
    }
  }

  // Generate motivational context for the AI agent
  generateMotivationalContext(userContext) {
    const { userName, streakBefore, betAmount, gymName, missedWorkouts } = userContext

    const contexts = [
      `${userName} had a ${streakBefore}-day streak going and just broke it by missing their workout at ${gymName}.`,
      `They have $${betAmount} on the line and just lost some of it due to this missed session.`,
      `This is their ${missedWorkouts} missed workout recently.`,
      `They need strong motivation to get back on track and not give up on their fitness goals.`,
      `Be encouraging but firm - remind them why they started this journey.`,
      `Focus on the fact that one setback doesn't define them, but consistency does.`,
      `Encourage them to get to the gym now if possible, or commit to tomorrow.`
    ]

    return contexts.join(' ')
  }

  // Create a motivational call for missed workout
  async triggerMissedWorkoutCall(phoneNumber, userStats, setupData) {
    const userData = this.getUserData()

    const userContext = {
      userName: userData?.email?.split('@')[0] || 'User',
      phoneNumber: phoneNumber,
      streakBefore: userStats.streak || 0,
      betAmount: userStats.walletBalance || 0,
      gymName: setupData.gymLocation?.name || 'your gym',
      workoutTime: setupData.workoutTime || 'your workout time',
      missedWorkouts: (userStats.totalMissedWorkouts || 0) + 1,
      currentBalance: userStats.walletBalance || 0,
      shoppingBalance: userStats.shoppingBalance || 0
    }

    console.log('Triggering missed workout call with context:', userContext)

    const result = await this.createCall(phoneNumber, userContext)

    if (result.success) {
      // Update user stats to track the call
      const updatedStats = {
        ...userStats,
        lastMotivationalCall: new Date().toISOString(),
        totalMotivationalCalls: (userStats.totalMotivationalCalls || 0) + 1,
        lastCallId: result.callId
      }

      localStorage.setItem('stayHardStats', JSON.stringify(updatedStats))
    }

    return result
  }

  // Create a check-in reminder call
  async triggerReminderCall(phoneNumber, userStats, setupData) {
    const userData = this.getUserData()

    const userContext = {
      userName: userData?.email?.split('@')[0] || 'User',
      phoneNumber: phoneNumber,
      streakBefore: userStats.streak || 0,
      betAmount: userStats.walletBalance || 0,
      gymName: setupData.gymLocation?.name || 'your gym',
      workoutTime: setupData.workoutTime || 'your workout time',
      callType: 'reminder',
      timeRemaining: '30 minutes'
    }

    return await this.createCall(phoneNumber, userContext)
  }

  // Get call status
  async getCallStatus(callId) {
    try {
      const response = await fetch(`${this.baseUrl}/call/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get call status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get call status:', error)
      return { error: error.message }
    }
  }

  // Log call attempts for debugging and analytics
  logCallAttempt(phoneNumber, userContext, result, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      phoneNumber: phoneNumber,
      userContext: userContext,
      success: !!result,
      callId: result?.call_id || null,
      error: error,
      result: result
    }

    // Get existing call logs
    const existingLogs = JSON.parse(localStorage.getItem('retellCallLogs') || '[]')
    existingLogs.unshift(logEntry)

    // Keep only last 50 logs
    if (existingLogs.length > 50) {
      existingLogs.splice(50)
    }

    localStorage.setItem('retellCallLogs', JSON.stringify(existingLogs))

    console.log('Retell AI call logged:', logEntry)
  }

  // Get call logs for debugging
  getCallLogs() {
    return JSON.parse(localStorage.getItem('retellCallLogs') || '[]')
  }

  // Test the Retell AI connection
  async testConnection() {
    try {
      // Try to get agent info to test connection
      const response = await fetch(`${this.baseUrl}/agent/${this.agentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (response.ok) {
        const agentInfo = await response.json()
        return {
          success: true,
          message: 'Retell AI connection successful',
          agentInfo: agentInfo
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
          details: errorText
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error.message}`
      }
    }
  }

  // Test with minimal call data
  async testMinimalCall(phoneNumber) {
    try {
      const minimalCallData = {
        from_number: '+17692481842',
        to_number: phoneNumber,
        agent_id: this.agentId
      }

      console.log('Testing minimal call with data:', minimalCallData)

      const response = await fetch(`${this.baseUrl}/create-phone-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minimalCallData)
      })

      const responseText = await response.text()
      console.log('Minimal call response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      })

      if (response.ok) {
        return {
          success: true,
          message: 'Minimal call test successful',
          data: JSON.parse(responseText)
        }
      } else {
        return {
          success: false,
          message: `Minimal call failed: ${response.status} ${response.statusText}`,
          details: responseText
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Minimal call error: ${error.message}`
      }
    }
  }

  // Helper method to get user data
  getUserData() {
    try {
      return JSON.parse(localStorage.getItem('stayHardUser') || 'null')
    } catch {
      return null
    }
  }

  // Clear call logs (for testing)
  clearCallLogs() {
    localStorage.removeItem('retellCallLogs')
  }
}

// Export singleton instance
export const retellAI = new RetellAIService()

// Utility functions
export const triggerMotivationalCall = async (phoneNumber, userStats, setupData) => {
  return await retellAI.triggerMissedWorkoutCall(phoneNumber, userStats, setupData)
}

export const triggerReminderCall = async (phoneNumber, userStats, setupData) => {
  return await retellAI.triggerReminderCall(phoneNumber, userStats, setupData)
}

export const testRetellConnection = async () => {
  return await retellAI.testConnection()
}

export const getCallLogs = () => {
  return retellAI.getCallLogs()
}

export const testMinimalCall = async (phoneNumber) => {
  return await retellAI.testMinimalCall(phoneNumber)
}
