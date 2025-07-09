import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const userData = localStorage.getItem('stayHardUser')
    if (userData) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
    setIsLoading(false)
  }, [])

  // Listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'stayHardUser' && !e.newValue) {
        // User was logged out
        setIsAuthenticated(false)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen transition-colors duration-200">
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ?
                <Navigate to="/dashboard" replace /> :
                <Login setIsAuthenticated={setIsAuthenticated} />
              }
            />
            <Route
              path="/setup"
              element={
                isAuthenticated ?
                <Setup /> :
                <Navigate to="/login" replace />
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ?
                <Dashboard /> :
                <Navigate to="/login" replace />
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
