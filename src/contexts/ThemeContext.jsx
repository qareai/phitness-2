import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true) // Default to dark theme

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('stayHardTheme')
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
    }
  }, [])

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('stayHardTheme', isDark ? 'dark' : 'light')
    
    // Update document class for global styling
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const theme = {
    isDark,
    toggleTheme,
    colors: isDark ? darkTheme : lightTheme
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

// Theme color definitions
const darkTheme = {
  // Backgrounds
  bg: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-700',
    gradient: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
  },
  // Text colors
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    muted: 'text-gray-500'
  },
  // Borders
  border: {
    primary: 'border-gray-700',
    secondary: 'border-gray-600',
    focus: 'border-blue-500'
  },
  // Buttons
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white'
  },
  // Cards
  card: 'bg-gray-800 border-gray-700',
  // Inputs
  input: 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500'
}

const lightTheme = {
  // Backgrounds
  bg: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    tertiary: 'bg-gray-100',
    gradient: 'bg-gradient-to-br from-blue-50 via-white to-gray-50'
  },
  // Text colors
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    tertiary: 'text-gray-600',
    muted: 'text-gray-500'
  },
  // Borders
  border: {
    primary: 'border-gray-300',
    secondary: 'border-gray-200',
    focus: 'border-blue-500'
  },
  // Buttons
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  // Cards
  card: 'bg-white border-gray-200 shadow-sm',
  // Inputs
  input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
}

// Theme toggle component
export const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors duration-200 ${
        isDark 
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      } ${className}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  )
}
