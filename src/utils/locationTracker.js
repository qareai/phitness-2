// Location tracking and geofencing utilities

class LocationTracker {
  constructor() {
    this.watchId = null
    this.isTracking = false
    this.callbacks = []
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  // Check if user is within geofence radius
  isWithinGeofence(userLat, userLon, targetLat, targetLon, radiusMeters = 10) {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon)
    return distance <= radiusMeters
  }

  // Start location tracking
  startTracking(callback) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    if (this.isTracking) {
      this.callbacks.push(callback)
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache position for 1 minute
    }

    this.callbacks.push(callback)
    this.isTracking = true

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        }

        // Call all registered callbacks
        this.callbacks.forEach(cb => cb(location, null))
      },
      (error) => {
        console.error('Location tracking error:', error)
        this.callbacks.forEach(cb => cb(null, error))
      },
      options
    )
  }

  // Stop location tracking
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    this.isTracking = false
    this.callbacks = []
  }

  // Get current position once
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          })
        },
        (error) => {
          reject(error)
        },
        options
      )
    })
  }

  // Check if user is at gym location
  async checkGymLocation(gymLat, gymLon, radiusMeters = 10) {
    try {
      const currentLocation = await this.getCurrentPosition()
      const isAtGym = this.isWithinGeofence(
        currentLocation.latitude,
        currentLocation.longitude,
        gymLat,
        gymLon,
        radiusMeters
      )

      return {
        isAtGym,
        currentLocation,
        distance: this.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          gymLat,
          gymLon
        )
      }
    } catch (error) {
      throw new Error(`Failed to check gym location: ${error.message}`)
    }
  }
}

// Workout session manager
class WorkoutSessionManager {
  constructor() {
    this.locationTracker = new LocationTracker()
    this.sessionActive = false
    this.checkInterval = null
  }

  // Start monitoring for workout session
  startSession(gymLocation, workoutTime) {
    const setupData = JSON.parse(localStorage.getItem('stayHardSetup') || '{}')
    const userStats = JSON.parse(localStorage.getItem('stayHardStats') || '{}')

    if (!setupData.gymLocation || !setupData.workoutTime) {
      throw new Error('Gym location and workout time must be set')
    }

    this.sessionActive = true
    
    // Check location every 5 minutes during workout window
    this.checkInterval = setInterval(async () => {
      try {
        const result = await this.locationTracker.checkGymLocation(
          setupData.gymLocation.lat,
          setupData.gymLocation.lng,
          10 // 10 meter radius
        )

        if (result.isAtGym) {
          this.handleSuccessfulCheckIn()
        } else {
          this.handleMissedCheckIn(result.distance)
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
  }

  // Handle successful gym check-in
  handleSuccessfulCheckIn() {
    const userStats = JSON.parse(localStorage.getItem('stayHardStats') || '{}')
    const now = new Date().toISOString()

    const updatedStats = {
      ...userStats,
      streak: userStats.streak + 1,
      totalSessions: userStats.totalSessions + 1,
      lastCheckIn: now
    }

    localStorage.setItem('stayHardStats', JSON.stringify(updatedStats))
    
    // Show success notification
    this.showNotification('🎉 Great job! Gym check-in successful!', 'success')
    
    // Stop session monitoring
    this.stopSession()
  }

  // Handle missed check-in
  handleMissedCheckIn(distance) {
    const userStats = JSON.parse(localStorage.getItem('stayHardStats') || '{}')
    
    // Deduct 10% of bet amount
    const penalty = Math.round(userStats.walletBalance * 0.1)
    const shoppingCredit = Math.round(userStats.walletBalance * 0.2)

    const updatedStats = {
      ...userStats,
      walletBalance: userStats.walletBalance - penalty,
      shoppingBalance: userStats.shoppingBalance + shoppingCredit,
      streak: 0 // Reset streak on missed session
    }

    localStorage.setItem('stayHardStats', JSON.stringify(updatedStats))
    
    // Show penalty notification
    this.showNotification(
      `💸 Missed workout! $${penalty} deducted. $${shoppingCredit} added to shopping credits.`,
      'error'
    )
  }

  // Stop session monitoring
  stopSession() {
    this.sessionActive = false
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.locationTracker.stopTracking()
  }

  // Show notification
  showNotification(message, type = 'info') {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Stay Hard Reminder', {
        body: message,
        icon: '/vite.svg',
        badge: '/vite.svg'
      })
    }

    // Also show browser alert as fallback
    alert(message)
  }

  // Check if it's workout time
  isWorkoutTime(workoutTimeSlot) {
    const now = new Date()
    const [startTime] = workoutTimeSlot.split(' - ')
    const [hours, minutes] = startTime.split(':')
    
    const workoutStart = new Date()
    workoutStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    const workoutEnd = new Date(workoutStart)
    workoutEnd.setHours(workoutEnd.getHours() + 1) // 1 hour window
    
    return now >= workoutStart && now <= workoutEnd
  }
}

// Export singleton instances
export const locationTracker = new LocationTracker()
export const workoutSessionManager = new WorkoutSessionManager()

// Utility functions
export const requestLocationPermission = async () => {
  try {
    const position = await locationTracker.getCurrentPosition()
    return { success: true, position }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const checkGymProximity = async (gymLat, gymLon) => {
  try {
    const result = await locationTracker.checkGymLocation(gymLat, gymLon)
    return result
  } catch (error) {
    throw new Error(`Failed to check gym proximity: ${error.message}`)
  }
}
