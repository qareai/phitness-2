import { useState, useEffect } from 'react'

// Simple gym location picker component
// In a real app, this would integrate with Google Maps API
function GymLocationPicker({ onLocationSelect, initialLocation = null }) {
  const [isPickingLocation, setIsPickingLocation] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPosition, setCurrentPosition] = useState(null)

  // Mock gym locations for demo purposes
  const mockGyms = [
    { name: 'Planet Fitness Downtown', lat: 40.7128, lng: -74.0060, address: '123 Main St, New York, NY' },
    { name: 'LA Fitness Center', lat: 40.7589, lng: -73.9851, address: '456 Broadway, New York, NY' },
    { name: 'Gold\'s Gym', lat: 40.7505, lng: -73.9934, address: '789 5th Ave, New York, NY' },
    { name: 'Equinox Fitness', lat: 40.7614, lng: -73.9776, address: '321 Park Ave, New York, NY' },
    { name: '24 Hour Fitness', lat: 40.7282, lng: -73.9942, address: '654 Union Sq, New York, NY' }
  ]

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting current position:', error)
        }
      )
    }
  }, [])

  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    onLocationSelect(location)
    setIsPickingLocation(false)
  }

  const handleCustomLocation = () => {
    const gymName = prompt('Enter your gym name:')
    if (!gymName) return

    const address = prompt('Enter gym address (optional):') || 'Custom location'
    
    // For demo, use current position or default coordinates
    const location = {
      name: gymName,
      lat: currentPosition?.lat || 40.7128,
      lng: currentPosition?.lng || -74.0060,
      address: address,
      isCustom: true
    }

    handleLocationSelect(location)
  }

  const filteredGyms = mockGyms.filter(gym =>
    gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gym.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isPickingLocation && selectedLocation) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-white">{selectedLocation.name}</h4>
              <p className="text-sm text-gray-300">{selectedLocation.address}</p>
              <p className="text-xs text-gray-400 mt-1">
                📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </p>
            </div>
            <button
              onClick={() => setIsPickingLocation(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition duration-200"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!isPickingLocation ? (
        <button
          onClick={() => setIsPickingLocation(true)}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
        >
          📍 Select Gym Location
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Select Your Gym</h3>
            <button
              onClick={() => setIsPickingLocation(false)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition duration-200"
            >
              Cancel
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search for gyms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Current Location Option */}
          {currentPosition && (
            <button
              onClick={() => handleLocationSelect({
                name: 'Current Location',
                lat: currentPosition.lat,
                lng: currentPosition.lng,
                address: 'Your current location',
                isCurrentLocation: true
              })}
              className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200 text-left"
            >
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                <div>
                  <div className="font-semibold">Use Current Location</div>
                  <div className="text-sm opacity-90">
                    {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Gym List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredGyms.map((gym, index) => (
              <button
                key={index}
                onClick={() => handleLocationSelect(gym)}
                className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition duration-200 text-left"
              >
                <div className="font-semibold">{gym.name}</div>
                <div className="text-sm text-gray-300">{gym.address}</div>
                <div className="text-xs text-gray-400 mt-1">
                  📍 {gym.lat.toFixed(4)}, {gym.lng.toFixed(4)}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Location */}
          <button
            onClick={handleCustomLocation}
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition duration-200"
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">➕</span>
              Add Custom Location
            </div>
          </button>

          {/* Note about Google Maps */}
          <div className="p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
            <p className="text-yellow-200 text-sm">
              <strong>Note:</strong> In a production app, this would integrate with Google Maps API 
              for real gym locations and precise coordinates. For demo purposes, we're using mock data.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GymLocationPicker
