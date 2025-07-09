import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, ThemeToggle } from '../contexts/ThemeContext'
import { dailyWorkflowEngine } from '../utils/workflowEngine.js'
import { checkGymProximity } from '../utils/locationTracker.js'
import RetellAITester from '../components/RetellAITester'
import WalletStatus from '../components/WalletStatus'
import FitnessChatbot from '../components/FitnessChatbot'


function Dashboard() {
  const [userStats, setUserStats] = useState(null)
  const [setupData, setSetupData] = useState(null)
  const [currentTip, setCurrentTip] = useState('')
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const [locationStatus, setLocationStatus] = useState(null)
  const [isCheckingLocation, setIsCheckingLocation] = useState(false)
  const navigate = useNavigate()
  const { colors } = useTheme()

  const fitnessTips = [
    "💪 Consistency beats perfection. Show up even when you don't feel like it.",
    "🔥 Your only competition is who you were yesterday.",
    "⚡ The pain you feel today will be the strength you feel tomorrow.",
    "🎯 Success is the sum of small efforts repeated day in and day out.",
    "💯 Don't wish for it, work for it.",
    "🚀 The hardest part is showing up. You've got this!",
    "⭐ Progress, not perfection.",
    "🏆 Champions train, losers complain."
  ]

  useEffect(() => {
    // Load user data
    const stats = localStorage.getItem('stayHardStats')
    const setup = localStorage.getItem('stayHardSetup')

    if (stats) {
      setUserStats(JSON.parse(stats))
    }

    if (setup) {
      setSetupData(JSON.parse(setup))
    } else {
      // If no setup data, redirect to setup
      navigate('/setup')
      return
    }

    // Set random fitness tip
    const randomTip = fitnessTips[Math.floor(Math.random() * fitnessTips.length)]
    setCurrentTip(randomTip)

    // Initialize workflow engine
    dailyWorkflowEngine.init()
  }, [navigate])

  const checkCurrentLocation = async () => {
    if (!setupData?.gymLocation) return

    setIsCheckingLocation(true)
    try {
      const result = await checkGymProximity(
        setupData.gymLocation.lat,
        setupData.gymLocation.lng
      )
      setLocationStatus(result)
    } catch (error) {
      setLocationStatus({ error: error.message })
    } finally {
      setIsCheckingLocation(false)
    }
  }

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      'Are you sure you want to logout? This will clear all your session data including workout stats and wallet information.'
    )

    if (!confirmLogout) return

    // Clear all user session data
    localStorage.removeItem('stayHardUser')
    localStorage.removeItem('stayHardSetup')
    localStorage.removeItem('stayHardStats')
    localStorage.removeItem('stayHardTransactions')
    localStorage.removeItem('retellCallLogs')
    localStorage.removeItem('dailyWorkflowReset')
    // Keep theme preference
    // localStorage.removeItem('stayHardTheme')

    // Stop any running workflows
    if (window.dailyWorkflowEngine) {
      window.dailyWorkflowEngine.stop()
    }

    // Navigate to login page
    navigate('/login')

    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const handleEditPreferences = () => {
    setIsEditingPreferences(true)
  }

  const handleManualCheckIn = async () => {
    if (!userStats) return

    try {
      const result = await dailyWorkflowEngine.manualCheckIn()
      if (result.success) {
        // Refresh user stats
        const updatedStats = JSON.parse(localStorage.getItem('stayHardStats') || '{}')
        setUserStats(updatedStats)
        alert('🎉 Great job! Check-in recorded!')
      } else {
        alert(`❌ Check-in failed: ${result.error}`)
      }
    } catch (error) {
      alert(`❌ Check-in failed: ${error.message}`)
    }
  }

  const getNextWorkoutTime = () => {
    if (!setupData?.workoutTime) return 'Not set'

    // Handle current time format
    if (setupData.workoutTime.includes('Current Time')) {
      return 'Active now (current time session)'
    }

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [startTime] = setupData.workoutTime.split(' - ')
    const [hours, minutes] = startTime.split(':')
    tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    return tomorrow.toLocaleDateString() + ' at ' + startTime
  }

  const isCurrentTimeSession = () => {
    return setupData?.workoutTime?.includes('Current Time')
  }

  if (!userStats || !setupData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${colors.bg.gradient}`}>
      {/* Header */}
      <div className={`${colors.bg.secondary} shadow-lg`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${colors.text.primary}`}>Stay Hard Dashboard</h1>
            <p className={colors.text.tertiary}>Keep pushing your limits</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className={`px-4 py-2 ${colors.button.danger} rounded-lg transition duration-200`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Streak Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Current Streak</h3>
                <p className="text-3xl font-bold text-blue-400">{userStats.streak}</p>
                <p className="text-gray-400 text-sm">days</p>
              </div>
              <div className="text-4xl">🔥</div>
            </div>
          </div>

          {/* Total Sessions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Total Sessions</h3>
                <p className="text-3xl font-bold text-green-400">{userStats.totalSessions}</p>
                <p className="text-gray-400 text-sm">workouts</p>
              </div>
              <div className="text-4xl">💪</div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Bet Balance</h3>
                <p className="text-3xl font-bold text-yellow-400">${userStats.walletBalance}</p>
                <p className="text-gray-400 text-sm">at stake</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Daily Tip */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">💡 Daily Motivation</h3>
              <p className="text-gray-300 text-lg italic">{currentTip}</p>
            </div>

            {/* Location Status */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">📍 Location Status</h3>
              {locationStatus ? (
                <div className="space-y-2">
                  {locationStatus.error ? (
                    <p className="text-red-400">❌ {locationStatus.error}</p>
                  ) : (
                    <>
                      <p className="text-gray-300">
                        Distance to gym: <span className="font-semibold">{Math.round(locationStatus.distance)}m</span>
                      </p>
                      <p className={`font-semibold ${locationStatus.isAtGym ? 'text-green-400' : 'text-yellow-400'}`}>
                        {locationStatus.isAtGym ? '✅ At gym location' : '📍 Not at gym'}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">Click to check your location</p>
              )}
              <button
                onClick={checkCurrentLocation}
                disabled={isCheckingLocation}
                className="w-full mt-4 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-semibold rounded-lg transition duration-200"
              >
                {isCheckingLocation ? 'Checking...' : '📍 Check Location'}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleManualCheckIn}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200"
                >
                  ✅ Manual Check-In
                </button>
                <button
                  onClick={handleEditPreferences}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
                >
                  ⚙️ Edit Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Next Session */}
            <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${
              isCurrentTimeSession() ? 'ring-2 ring-green-500' : ''
            }`}>
              <h3 className="text-lg font-semibold text-white mb-4">
                📅 {isCurrentTimeSession() ? 'Current Session' : 'Next Session'}
              </h3>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="font-medium">Time:</span> {getNextWorkoutTime()}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Location:</span> {setupData.gymLocation.name}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Bet at stake:</span> ${Math.round(userStats.walletBalance * 0.1)}
                </p>
                {isCurrentTimeSession() && (
                  <div className="mt-3 p-2 bg-green-900 border border-green-700 rounded">
                    <p className="text-green-200 text-sm">
                      🟢 Active session - check in when you arrive at the gym!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Details */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">💳 Wallet Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Bet Balance:</span>
                  <span className="text-yellow-400 font-semibold">${userStats.walletBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Shopping Credits:</span>
                  <span className="text-green-400 font-semibold">${userStats.shoppingBalance}</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">Total:</span>
                    <span className="text-blue-400 font-bold">
                      ${userStats.walletBalance + userStats.shoppingBalance}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Recent Activity</h3>
              {userStats.lastCheckIn ? (
                <div className="space-y-2">
                  <p className="text-gray-300">
                    Last check-in: {new Date(userStats.lastCheckIn).toLocaleDateString()}
                  </p>
                  <p className="text-green-400 text-sm">✅ Session completed</p>
                  {userStats.lastMotivationalCall && (
                    <p className="text-blue-400 text-sm">
                      📞 Last call: {new Date(userStats.lastMotivationalCall).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Components */}
        <div className="mt-8 space-y-8">
          {/* Fitness Chatbot */}
          <FitnessChatbot />

          {/* Wallet */}
          <WalletStatus />

          {/* Retell AI Testing */}
          <RetellAITester />
        </div>

        {/* Edit Preferences Modal */}
        {isEditingPreferences && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">Edit Preferences</h3>
              <p className="text-gray-300 mb-4">
                To modify your preferences, please go through the setup process again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/setup')}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                >
                  Go to Setup
                </button>
                <button
                  onClick={() => setIsEditingPreferences(false)}
                  className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard