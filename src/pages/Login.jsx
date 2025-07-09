import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simple validation
    if (!formData.email || !formData.password) {
      alert('Please fill in all fields')
      setIsLoading(false)
      return
    }

    // Simulate login (in real app, this would be an API call)
    setTimeout(() => {
      // Clear any existing session data first
      localStorage.removeItem('stayHardUser')
      localStorage.removeItem('stayHardSetup')
      localStorage.removeItem('stayHardStats')
      localStorage.removeItem('stayHardTransactions')
      localStorage.removeItem('retellCallLogs')
      localStorage.removeItem('dailyWorkflowReset')

      // Create new user session
      const userData = {
        email: formData.email,
        loginTime: new Date().toISOString()
      }

      localStorage.setItem('stayHardUser', JSON.stringify(userData))
      setIsAuthenticated(true)
      setIsLoading(false)

      // Always go to setup for fresh login
      navigate('/setup')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Stay Hard</h1>
          <p className="text-gray-400 text-lg">Reminder</p>
          <p className="text-gray-500 mt-4">Your fitness accountability partner</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Ready to commit to your fitness goals?
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
