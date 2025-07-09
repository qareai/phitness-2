import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GymLocationPicker from '../components/GymLocationPicker'
import FlexibleTimeSelector from '../components/FlexibleTimeSelector'
import { initializeUserWallet } from '../utils/walletManager'

function Setup() {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    fitnessLevel: '',
    gymLocation: {
      name: '',
      lat: null,
      lng: null
    },
    workoutTime: '',
    phoneNumber: '',
    betAmount: 50
  })
  const [isLoading, setIsLoading] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState({
    location: false,
    notifications: false
  })
  const navigate = useNavigate()

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      'Are you sure you want to logout? Any setup progress will be lost.'
    )

    if (!confirmLogout) return

    // Clear all user session data
    localStorage.removeItem('stayHardUser')
    localStorage.removeItem('stayHardSetup')
    localStorage.removeItem('stayHardStats')
    localStorage.removeItem('stayHardTransactions')
    localStorage.removeItem('retellCallLogs')
    localStorage.removeItem('dailyWorkflowReset')

    // Navigate to login page
    navigate('/login')

    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBetAmountChange = (e) => {
    setFormData(prev => ({
      ...prev,
      betAmount: parseInt(e.target.value)
    }))
  }

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })
      setPermissionsGranted(prev => ({ ...prev, location: true }))
      alert('Location permission granted!')
    } catch (error) {
      alert('Location permission denied. Please enable location access for the app to work properly.')
    }
  }

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setPermissionsGranted(prev => ({ ...prev, notifications: true }))
        alert('Notification permission granted!')
      } else {
        alert('Notification permission denied. You may miss important reminders.')
      }
    } catch (error) {
      alert('Notification permission request failed.')
    }
  }

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      gymLocation: location
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (!formData.age || !formData.gender || !formData.fitnessLevel || 
        !formData.gymLocation.name || !formData.workoutTime || !formData.phoneNumber) {
      alert('Please fill in all fields')
      setIsLoading(false)
      return
    }

    if (!permissionsGranted.location || !permissionsGranted.notifications) {
      alert('Please grant all required permissions to continue')
      setIsLoading(false)
      return
    }

    // Save setup data
    const setupData = {
      ...formData,
      setupCompleted: true,
      createdAt: new Date().toISOString()
    }

    localStorage.setItem('stayHardSetup', JSON.stringify(setupData))

    // Initialize wallet with bet amount
    initializeUserWallet(formData.betAmount)

    setIsLoading(false)
    navigate('/dashboard')
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Let's Set You Up</h1>
            <p className="text-gray-400">Tell us about your fitness journey</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200 ml-4"
            title="Logout and clear session"
          >
            Logout
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="13"
              max="100"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your age"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          {/* Fitness Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fitness Level</label>
            <select
              name="fitnessLevel"
              value={formData.fitnessLevel}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select fitness level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Gym Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gym Location</label>
            <GymLocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.gymLocation.name ? formData.gymLocation : null}
            />
          </div>

          {/* Workout Time */}
          <div>
            <FlexibleTimeSelector
              value={formData.workoutTime}
              onChange={(time) => setFormData(prev => ({ ...prev, workoutTime: time }))}
              label="Preferred Workout Time"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Bet Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bet Amount: ${formData.betAmount}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={formData.betAmount}
              onChange={handleBetAmountChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>$10</span>
              <span>$500</span>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Required Permissions</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Location Access</p>
                <p className="text-sm text-gray-400">Required for gym check-ins</p>
              </div>
              <button
                type="button"
                onClick={requestLocationPermission}
                className={`px-4 py-2 rounded-lg transition duration-200 ${
                  permissionsGranted.location 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {permissionsGranted.location ? '✓ Granted' : 'Grant'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Push Notifications</p>
                <p className="text-sm text-gray-400">Required for workout reminders</p>
              </div>
              <button
                type="button"
                onClick={requestNotificationPermission}
                className={`px-4 py-2 rounded-lg transition duration-200 ${
                  permissionsGranted.notifications 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {permissionsGranted.notifications ? '✓ Granted' : 'Grant'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? 'Setting Up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Setup
