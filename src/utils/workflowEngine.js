// Daily workflow engine for Stay Hard Reminder app

import { locationTracker, workoutSessionManager } from './locationTracker.js'
import { notificationManager, workoutNotificationWorkflow } from './notificationManager.js'
import { triggerMotivationalCall } from './retellAI.js'

class DailyWorkflowEngine {
  constructor() {
    this.isRunning = false
    this.checkInterval = null
    this.dailyResetTimeout = null
    this.workoutCheckTimeout = null
  }

  // Initialize the workflow engine
  async init() {
    try {
      // Load user data
      const setupData = this.getSetupData()
      const userStats = this.getUserStats()
      const userData = this.getUserData()

      if (!setupData || !userStats || !userData) {
        console.log('User data not complete, workflow not started')
        return false
      }

      // Start the daily workflow
      this.startDailyWorkflow()
      return true
    } catch (error) {
      console.error('Failed to initialize workflow engine:', error)
      return false
    }
  }

  // Start the daily workflow
  startDailyWorkflow() {
    if (this.isRunning) {
      this.stop()
    }

    this.isRunning = true
    console.log('Daily workflow engine started')

    // Schedule daily reset at midnight
    this.scheduleDailyReset()

    // Schedule workout check for today
    this.scheduleWorkoutCheck()

    // Start periodic location monitoring during workout hours
    this.startPeriodicChecks()
  }

  // Schedule daily reset at midnight
  scheduleDailyReset() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const timeUntilMidnight = tomorrow.getTime() - now.getTime()

    this.dailyResetTimeout = setTimeout(() => {
      this.performDailyReset()
      this.scheduleDailyReset() // Schedule next reset
    }, timeUntilMidnight)
  }

  // Schedule workout check for user's preferred time
  scheduleWorkoutCheck() {
    const setupData = this.getSetupData()
    if (!setupData?.workoutTime) return

    // Handle current time sessions - start immediately
    if (setupData.workoutTime.includes('Current Time')) {
      console.log('Current time session detected - starting workout monitoring immediately')
      this.startWorkoutSession()
      return
    }

    const [startTime] = setupData.workoutTime.split(' - ')
    const [hours, minutes] = startTime.split(':')

    const now = new Date()
    const workoutTime = new Date()
    workoutTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    // If workout time has passed today, schedule for tomorrow
    if (workoutTime <= now) {
      workoutTime.setDate(workoutTime.getDate() + 1)
    }

    const timeUntilWorkout = workoutTime.getTime() - now.getTime()

    this.workoutCheckTimeout = setTimeout(() => {
      this.startWorkoutSession()
    }, timeUntilWorkout)
  }

  // Start workout session monitoring
  async startWorkoutSession() {
    try {
      const setupData = this.getSetupData()
      const userData = this.getUserData()
      
      console.log('Starting workout session monitoring')

      // Start notification workflow
      workoutNotificationWorkflow.startDailyWorkflow(setupData, userData.email)

      // Start location-based session monitoring
      workoutSessionManager.startSession(setupData.gymLocation, setupData.workoutTime)

      // Schedule next workout check for tomorrow
      this.scheduleWorkoutCheck()
    } catch (error) {
      console.error('Failed to start workout session:', error)
    }
  }

  // Perform daily reset
  performDailyReset() {
    console.log('Performing daily reset')
    
    const userStats = this.getUserStats()
    const today = new Date().toDateString()
    
    // Check if user checked in yesterday
    const lastCheckIn = userStats.lastCheckIn ? new Date(userStats.lastCheckIn).toDateString() : null
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayString = yesterday.toDateString()

    if (lastCheckIn !== yesterdayString && lastCheckIn !== today) {
      // User missed yesterday's workout, reset streak
      const updatedStats = {
        ...userStats,
        streak: 0,
        lastMissedDate: yesterdayString
      }
      this.saveUserStats(updatedStats)
      console.log('Streak reset due to missed workout')
    }

    // Reset daily flags
    localStorage.setItem('dailyWorkflowReset', today)
  }

  // Start periodic location checks during workout window
  startPeriodicChecks() {
    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.performPeriodicCheck()
    }, 5 * 60 * 1000)
  }

  // Perform periodic check
  async performPeriodicCheck() {
    try {
      const setupData = this.getSetupData()
      if (!setupData?.workoutTime || !setupData?.gymLocation) return

      // Check if it's currently workout time
      if (!this.isCurrentlyWorkoutTime(setupData.workoutTime)) return

      // Check if user is at gym
      const result = await locationTracker.checkGymLocation(
        setupData.gymLocation.lat,
        setupData.gymLocation.lng,
        10 // 10 meter radius
      )

      if (result.isAtGym) {
        this.handleSuccessfulCheckIn()
      }
    } catch (error) {
      console.error('Periodic check failed:', error)
    }
  }

  // Check if it's currently workout time
  isCurrentlyWorkoutTime(workoutTimeSlot) {
    // Handle current time sessions
    if (workoutTimeSlot.includes('Current Time')) {
      return true // Current time sessions are always active
    }

    const now = new Date()
    const [startTime, endTime] = workoutTimeSlot.split(' - ')

    const [startHours, startMinutes] = startTime.split(':')
    const [endHours, endMinutes] = endTime.split(':')

    const workoutStart = new Date()
    workoutStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)

    const workoutEnd = new Date()
    workoutEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)

    return now >= workoutStart && now <= workoutEnd
  }

  // Handle successful check-in
  handleSuccessfulCheckIn() {
    const userStats = this.getUserStats()
    const now = new Date().toISOString()
    const today = new Date().toDateString()

    // Check if already checked in today
    const lastCheckIn = userStats.lastCheckIn ? new Date(userStats.lastCheckIn).toDateString() : null
    if (lastCheckIn === today) {
      console.log('Already checked in today')
      return
    }

    const updatedStats = {
      ...userStats,
      streak: userStats.streak + 1,
      totalSessions: userStats.totalSessions + 1,
      lastCheckIn: now
    }

    this.saveUserStats(updatedStats)
    
    // Show success notification
    notificationManager.showSuccessNotification(updatedStats.streak)
    
    // Stop workflow for today
    workoutNotificationWorkflow.stopWorkflow()
    
    console.log('Successful check-in recorded')
  }

  // Apply penalty for missed workout
  applyPenalty() {
    const userStats = this.getUserStats()
    const penaltyAmount = Math.round(userStats.walletBalance * 0.1)
    const shoppingCredit = Math.round(userStats.walletBalance * 0.2)

    const updatedStats = {
      ...userStats,
      walletBalance: Math.max(0, userStats.walletBalance - penaltyAmount),
      shoppingBalance: userStats.shoppingBalance + shoppingCredit,
      streak: 0,
      lastPenalty: new Date().toISOString(),
      totalPenalties: (userStats.totalPenalties || 0) + 1
    }

    this.saveUserStats(updatedStats)
    
    // Show penalty notification
    notificationManager.showPenaltyNotification(penaltyAmount, shoppingCredit)
    
    console.log(`Penalty applied: $${penaltyAmount} deducted, $${shoppingCredit} added to shopping`)
  }

  // Manual check-in (for testing or manual override)
  async manualCheckIn() {
    try {
      const setupData = this.getSetupData()
      
      // Check location if gym coordinates are available
      if (setupData?.gymLocation?.lat && setupData?.gymLocation?.lng) {
        const result = await locationTracker.checkGymLocation(
          setupData.gymLocation.lat,
          setupData.gymLocation.lng,
          50 // More lenient radius for manual check-in
        )
        
        if (!result.isAtGym) {
          const distance = Math.round(result.distance)
          throw new Error(`You're ${distance}m away from your gym. Get closer to check in!`)
        }
      }

      this.handleSuccessfulCheckIn()
      return { success: true, message: 'Check-in successful!' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Stop the workflow engine
  stop() {
    this.isRunning = false
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    
    if (this.dailyResetTimeout) {
      clearTimeout(this.dailyResetTimeout)
      this.dailyResetTimeout = null
    }
    
    if (this.workoutCheckTimeout) {
      clearTimeout(this.workoutCheckTimeout)
      this.workoutCheckTimeout = null
    }

    workoutSessionManager.stopSession()
    workoutNotificationWorkflow.stopWorkflow()
    
    console.log('Daily workflow engine stopped')
  }

  // Utility methods for data management
  getSetupData() {
    try {
      return JSON.parse(localStorage.getItem('stayHardSetup') || 'null')
    } catch {
      return null
    }
  }

  getUserStats() {
    try {
      return JSON.parse(localStorage.getItem('stayHardStats') || 'null')
    } catch {
      return null
    }
  }

  getUserData() {
    try {
      return JSON.parse(localStorage.getItem('stayHardUser') || 'null')
    } catch {
      return null
    }
  }

  saveUserStats(stats) {
    localStorage.setItem('stayHardStats', JSON.stringify(stats))
  }

  // Get workflow status
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasCheckInterval: !!this.checkInterval,
      hasDailyReset: !!this.dailyResetTimeout,
      hasWorkoutCheck: !!this.workoutCheckTimeout,
      setupComplete: !!this.getSetupData(),
      userLoggedIn: !!this.getUserData()
    }
  }
}

// Export singleton instance
export const dailyWorkflowEngine = new DailyWorkflowEngine()

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(() => {
    dailyWorkflowEngine.init()
  }, 1000)
}
