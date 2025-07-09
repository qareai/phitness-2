import { useState, useEffect } from 'react'

function FlexibleTimeSelector({ value, onChange, label = "Workout Time" }) {
  const [timeMode, setTimeMode] = useState('preset') // 'preset', 'custom', 'current'
  const [customStartTime, setCustomStartTime] = useState('')
  const [customEndTime, setCustomEndTime] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  // Preset time slots
  const presetTimeSlots = [
    '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
    '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00',
    '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00',
    '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00'
  ]

  useEffect(() => {
    // Update current time every minute
    const updateCurrentTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const endHour = (now.getHours() + 1).toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes} - ${endHour}:${minutes}`)
    }

    updateCurrentTime()
    const interval = setInterval(updateCurrentTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Initialize based on existing value
    if (value) {
      if (presetTimeSlots.includes(value)) {
        setTimeMode('preset')
      } else if (value.includes('Current')) {
        setTimeMode('current')
      } else {
        setTimeMode('custom')
        const [start, end] = value.split(' - ')
        setCustomStartTime(start)
        setCustomEndTime(end)
      }
    }
  }, [value])

  const handleTimeModeChange = (mode) => {
    setTimeMode(mode)
    
    if (mode === 'current') {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const endHour = (now.getHours() + 1).toString().padStart(2, '0')
      const currentTimeSlot = `${hours}:${minutes} - ${endHour}:${minutes}`
      onChange(`Current Time (${currentTimeSlot})`)
    } else if (mode === 'preset' && presetTimeSlots[0]) {
      onChange(presetTimeSlots[0])
    } else if (mode === 'custom') {
      onChange('')
    }
  }

  const handlePresetChange = (timeSlot) => {
    onChange(timeSlot)
  }

  const handleCustomTimeChange = () => {
    if (customStartTime && customEndTime) {
      const customTimeSlot = `${customStartTime} - ${customEndTime}`
      onChange(customTimeSlot)
    }
  }

  const handleCurrentTimeSelect = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const endHour = (now.getHours() + 1).toString().padStart(2, '0')
    const currentTimeSlot = `${hours}:${minutes} - ${endHour}:${minutes}`
    onChange(`Current Time (${currentTimeSlot})`)
  }

  const formatCurrentTime = () => {
    const now = new Date()
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      
      {/* Time Mode Selection */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleTimeModeChange('current')}
          className={`px-4 py-2 rounded-lg transition duration-200 ${
            timeMode === 'current'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🕐 Current Time
        </button>
        <button
          type="button"
          onClick={() => handleTimeModeChange('preset')}
          className={`px-4 py-2 rounded-lg transition duration-200 ${
            timeMode === 'preset'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📋 Preset Times
        </button>
        <button
          type="button"
          onClick={() => handleTimeModeChange('custom')}
          className={`px-4 py-2 rounded-lg transition duration-200 ${
            timeMode === 'custom'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ⚙️ Custom Time
        </button>
      </div>

      {/* Current Time Option */}
      {timeMode === 'current' && (
        <div className="p-4 bg-green-900 border border-green-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold">Start Workout Now</h4>
              <p className="text-green-200 text-sm">
                Current time: {formatCurrentTime()} (1-hour session)
              </p>
              <p className="text-green-300 text-xs mt-1">
                Perfect for immediate gym sessions!
              </p>
            </div>
            <button
              type="button"
              onClick={handleCurrentTimeSelect}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200"
            >
              Select Now
            </button>
          </div>
          {value && value.includes('Current') && (
            <div className="mt-3 p-2 bg-green-800 rounded text-green-100 text-sm">
              ✅ Selected: {value}
            </div>
          )}
        </div>
      )}

      {/* Preset Time Slots */}
      {timeMode === 'preset' && (
        <div className="space-y-2">
          <select
            value={value || ''}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select workout time</option>
            {presetTimeSlots.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          <p className="text-gray-400 text-sm">
            Choose from popular 1-hour workout slots
          </p>
        </div>
      )}

      {/* Custom Time Input */}
      {timeMode === 'custom' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Time</label>
              <input
                type="time"
                value={customStartTime}
                onChange={(e) => {
                  setCustomStartTime(e.target.value)
                  if (e.target.value && customEndTime) {
                    handleCustomTimeChange()
                  }
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Time</label>
              <input
                type="time"
                value={customEndTime}
                onChange={(e) => {
                  setCustomEndTime(e.target.value)
                  if (customStartTime && e.target.value) {
                    handleCustomTimeChange()
                  }
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          {customStartTime && customEndTime && (
            <div className="p-3 bg-purple-900 border border-purple-700 rounded-lg">
              <p className="text-purple-200 text-sm">
                ✅ Custom time: {customStartTime} - {customEndTime}
              </p>
            </div>
          )}
          
          <p className="text-gray-400 text-sm">
            Set your own custom workout time window
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            const hours = now.getHours().toString().padStart(2, '0')
            const minutes = now.getMinutes().toString().padStart(2, '0')
            setCustomStartTime(`${hours}:${minutes}`)
            setCustomEndTime(`${(now.getHours() + 1).toString().padStart(2, '0')}:${minutes}`)
            setTimeMode('custom')
            handleCustomTimeChange()
          }}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition duration-200"
        >
          Use Current Time
        </button>
        <button
          type="button"
          onClick={() => {
            setCustomStartTime('18:00')
            setCustomEndTime('19:00')
            setTimeMode('custom')
            onChange('18:00 - 19:00')
          }}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition duration-200"
        >
          Evening (6-7 PM)
        </button>
        <button
          type="button"
          onClick={() => {
            setCustomStartTime('07:00')
            setCustomEndTime('08:00')
            setTimeMode('custom')
            onChange('07:00 - 08:00')
          }}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition duration-200"
        >
          Morning (7-8 AM)
        </button>
      </div>
    </div>
  )
}

export default FlexibleTimeSelector
