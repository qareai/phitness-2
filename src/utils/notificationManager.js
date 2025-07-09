// Notification management system
import { triggerMotivationalCall, triggerReminderCall } from './retellAI.js'

class NotificationManager {
  constructor() {
    this.permission = 'default'
    this.scheduledNotifications = new Map()
    this.init()
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    if (this.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    return permission === 'granted'
  }

  // Show immediate notification
  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return null
    }

    const defaultOptions = {
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      ...options
    }

    const notification = new Notification(title, defaultOptions)
    
    // Auto-close after 10 seconds if not interactive
    if (!defaultOptions.requireInteraction) {
      setTimeout(() => {
        notification.close()
      }, 10000)
    }

    return notification
  }

  // Show workout reminder notification
  showWorkoutReminder(userName, gymName, workoutTime) {
    const title = `🏋️ Workout Time, ${userName}!`
    const body = `It's time for your workout at ${gymName}. Your session starts at ${workoutTime}.`
    
    const notification = this.showNotification(title, {
      body,
      tag: 'workout-reminder',
      actions: [
        {
          action: 'going',
          title: "I'm going!"
        },
        {
          action: 'skip',
          title: 'Skip today'
        }
      ]
    })

    if (notification) {
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    }

    return notification
  }

  // Show motivational call notification
  showMotivationalCall(userName) {
    const title = `📞 Motivational Call Incoming`
    const body = `Hey ${userName}, you're about to receive a motivational call. Don't give up on your goals!`
    
    return this.showNotification(title, {
      body,
      tag: 'motivational-call',
      requireInteraction: true
    })
  }

  // Show penalty warning
  showPenaltyWarning(penaltyAmount, timeRemaining) {
    const title = `⚠️ Warning: Bet at Risk!`
    const body = `You'll lose $${penaltyAmount} if you don't check in within ${timeRemaining} minutes. Clock's ticking!`
    
    return this.showNotification(title, {
      body,
      tag: 'penalty-warning',
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300]
    })
  }

  // Show penalty notification
  showPenaltyNotification(penaltyAmount, shoppingCredit) {
    const title = `💸 Bet Penalty Applied`
    const body = `$${penaltyAmount} deducted from your bet. $${shoppingCredit} added to shopping credits. No one's coming to save you.`
    
    return this.showNotification(title, {
      body,
      tag: 'penalty-applied',
      requireInteraction: true
    })
  }

  // Show success notification
  showSuccessNotification(streakCount) {
    const title = `🎉 Workout Complete!`
    const body = `Great job! You've maintained your ${streakCount}-day streak. Keep pushing!`
    
    return this.showNotification(title, {
      body,
      tag: 'workout-success'
    })
  }

  // Schedule notification for specific time
  scheduleNotification(id, title, body, scheduledTime, options = {}) {
    const now = new Date().getTime()
    const scheduleTime = new Date(scheduledTime).getTime()
    const delay = scheduleTime - now

    if (delay <= 0) {
      // If time has passed, show immediately
      return this.showNotification(title, { body, ...options })
    }

    const timeoutId = setTimeout(() => {
      this.showNotification(title, { body, ...options })
      this.scheduledNotifications.delete(id)
    }, delay)

    this.scheduledNotifications.set(id, timeoutId)
    return timeoutId
  }

  // Cancel scheduled notification
  cancelScheduledNotification(id) {
    const timeoutId = this.scheduledNotifications.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.scheduledNotifications.delete(id)
      return true
    }
    return false
  }

  // Schedule daily workout reminders
  scheduleDailyWorkoutReminder(workoutTime, gymName, userName) {
    const [hours, minutes] = workoutTime.split(':')
    const now = new Date()
    
    // Schedule for today if time hasn't passed, otherwise tomorrow
    const reminderTime = new Date()
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const id = `daily-reminder-${reminderTime.toDateString()}`
    
    return this.scheduleNotification(
      id,
      `🏋️ Workout Time, ${userName}!`,
      `Time for your workout at ${gymName}`,
      reminderTime,
      {
        tag: 'daily-workout-reminder',
        requireInteraction: true
      }
    )
  }

  // Clear all scheduled notifications
  clearAllScheduled() {
    this.scheduledNotifications.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    this.scheduledNotifications.clear()
  }
}

// Workout notification workflow
class WorkoutNotificationWorkflow {
  constructor(notificationManager) {
    this.notificationManager = notificationManager
    this.workflowActive = false
    this.timeouts = []
  }

  // Start the daily workflow
  startDailyWorkflow(setupData, userName) {
    if (this.workflowActive) {
      this.stopWorkflow()
    }

    this.workflowActive = true
    const { workoutTime, gymLocation } = setupData

    // Parse workout time
    const [startTime] = workoutTime.split(' - ')
    const [hours, minutes] = startTime.split(':')
    
    const workoutStart = new Date()
    workoutStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    // If workout time has passed today, schedule for tomorrow
    const now = new Date()
    if (workoutStart <= now) {
      workoutStart.setDate(workoutStart.getDate() + 1)
    }

    // Schedule initial reminder (at workout time)
    const initialReminder = setTimeout(() => {
      this.notificationManager.showWorkoutReminder(
        userName,
        gymLocation.name,
        startTime
      )
      
      // Start the escalation sequence
      this.startEscalationSequence(setupData, userName)
    }, workoutStart.getTime() - now.getTime())

    this.timeouts.push(initialReminder)
  }

  // Start escalation sequence if user doesn't check in
  startEscalationSequence(setupData, userName) {
    const userStats = JSON.parse(localStorage.getItem('stayHardStats') || '{}')
    const penaltyAmount = Math.round(userStats.walletBalance * 0.1)

    // 15-minute warning
    const warning15 = setTimeout(() => {
      this.notificationManager.showPenaltyWarning(penaltyAmount, 45)
    }, 15 * 60 * 1000)

    // 30-minute warning with call trigger
    const warning30 = setTimeout(() => {
      this.notificationManager.showMotivationalCall(userName)
      // Here you would trigger the Retelle AI call
      this.triggerMotivationalCall(setupData.phoneNumber)
    }, 30 * 60 * 1000)

    // Final warning at 45 minutes
    const finalWarning = setTimeout(() => {
      this.notificationManager.showPenaltyWarning(penaltyAmount, 15)
    }, 45 * 60 * 1000)

    // Apply penalty at 60 minutes
    const penaltyTimeout = setTimeout(() => {
      this.applyPenalty(userStats)
    }, 60 * 60 * 1000)

    this.timeouts.push(warning15, warning30, finalWarning, penaltyTimeout)
  }

  // Trigger motivational call using Retell AI
  async triggerMotivationalCall(phoneNumber) {
    console.log(`Triggering Retell AI motivational call to ${phoneNumber}`)

    try {
      // Get user data for context
      const userStats = JSON.parse(localStorage.getItem('stayHardStats') || '{}')
      const setupData = JSON.parse(localStorage.getItem('stayHardSetup') || '{}')

      // Show notification that call is being initiated
      this.notificationManager.showNotification(
        '📞 Motivational Call Incoming',
        {
          body: 'A motivational call is being placed to help you stay on track!',
          requireInteraction: true
        }
      )

      // Trigger the actual Retell AI call
      const result = await triggerMotivationalCall(phoneNumber, userStats, setupData)

      if (result.success) {
        // Show success notification
        this.notificationManager.showNotification(
          '✅ Call Initiated',
          {
            body: `Motivational call started successfully. Call ID: ${result.callId}`,
            requireInteraction: false
          }
        )
        console.log('Retell AI call initiated successfully:', result)
      } else {
        // Show error notification
        this.notificationManager.showNotification(
          '❌ Call Failed',
          {
            body: `Failed to initiate call: ${result.message}`,
            requireInteraction: true
          }
        )
        console.error('Retell AI call failed:', result)
      }

      return result
    } catch (error) {
      console.error('Error triggering motivational call:', error)

      this.notificationManager.showNotification(
        '❌ Call Error',
        {
          body: 'An error occurred while trying to place the motivational call.',
          requireInteraction: true
        }
      )

      return { success: false, error: error.message }
    }
  }

  // Apply penalty for missed workout
  applyPenalty(userStats) {
    const penaltyAmount = Math.round(userStats.walletBalance * 0.1)
    const shoppingCredit = Math.round(userStats.walletBalance * 0.2)

    const updatedStats = {
      ...userStats,
      walletBalance: userStats.walletBalance - penaltyAmount,
      shoppingBalance: userStats.shoppingBalance + shoppingCredit,
      streak: 0 // Reset streak
    }

    localStorage.setItem('stayHardStats', JSON.stringify(updatedStats))
    
    this.notificationManager.showPenaltyNotification(penaltyAmount, shoppingCredit)
    this.stopWorkflow()
  }

  // Stop the workflow (called when user checks in successfully)
  stopWorkflow() {
    this.workflowActive = false
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts = []
  }
}

// Export singleton instances
export const notificationManager = new NotificationManager()
export const workoutNotificationWorkflow = new WorkoutNotificationWorkflow(notificationManager)

// Utility functions
export const requestNotificationPermission = async () => {
  try {
    const granted = await notificationManager.requestPermission()
    return { success: granted, permission: notificationManager.permission }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const scheduleWorkoutReminders = (setupData, userName) => {
  return workoutNotificationWorkflow.startDailyWorkflow(setupData, userName)
}
