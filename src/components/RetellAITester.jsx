import { useState } from 'react'
import { triggerMotivationalCall, getCallLogs, testMinimalCall } from '../utils/retellAI.js'

function RetellAITester() {
  const [isPlacingCall, setIsPlacingCall] = useState(false)
  const [callResult, setCallResult] = useState(null)
  const [testPhoneNumber, setTestPhoneNumber] = useState('')
  const [showCallLogs, setShowCallLogs] = useState(false)
  const [callLogs, setCallLogs] = useState([])
  const [isSimulatingPenalty, setIsSimulatingPenalty] = useState(false)
  const [penaltyResult, setPenaltyResult] = useState(null)

  const handleSimulatePenalty = async () => {
    setIsSimulatingPenalty(true)
    setPenaltyResult(null)

    try {
      // Get current user stats
      const currentStats = JSON.parse(localStorage.getItem('stayHardStats') || '{}')
      const originalBalance = currentStats.walletBalance || 0

      if (originalBalance <= 0) {
        setPenaltyResult({
          success: false,
          message: 'No bet balance available to deduct from'
        })
        return
      }

      // Calculate penalty amounts
      const penaltyAmount = Math.round(originalBalance * 0.1)
      const shoppingCredit = Math.round(originalBalance * 0.2)
      const newBalance = originalBalance - penaltyAmount

      // Apply the penalty
      const updatedStats = {
        ...currentStats,
        walletBalance: newBalance,
        shoppingBalance: (currentStats.shoppingBalance || 0) + shoppingCredit,
        streak: 0, // Reset streak
        totalPenalties: (currentStats.totalPenalties || 0) + penaltyAmount,
        totalShoppingCredits: (currentStats.totalShoppingCredits || 0) + shoppingCredit,
        lastPenaltyDate: new Date().toISOString()
      }

      // Save updated stats
      localStorage.setItem('stayHardStats', JSON.stringify(updatedStats))

      // Add transaction record
      const transactions = JSON.parse(localStorage.getItem('stayHardTransactions') || '[]')
      const newTransaction = {
        id: Date.now().toString(),
        type: 'penalty_simulation',
        amount: penaltyAmount,
        description: 'Simulated missed workout penalty',
        timestamp: new Date().toISOString(),
        metadata: {
          originalBalance,
          penaltyAmount,
          shoppingCredit,
          newBalance
        }
      }
      transactions.unshift(newTransaction)
      localStorage.setItem('stayHardTransactions', JSON.stringify(transactions))

      setPenaltyResult({
        success: true,
        message: 'Penalty simulation completed',
        details: {
          originalBalance,
          penaltyAmount,
          shoppingCredit,
          newBalance
        }
      })

      // Trigger page refresh to update dashboard
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      setPenaltyResult({
        success: false,
        message: `Simulation failed: ${error.message}`
      })
    } finally {
      setIsSimulatingPenalty(false)
    }
  }

  const handleTestCall = async () => {
    if (!testPhoneNumber) {
      alert('Please enter a phone number to test')
      return
    }

    setIsPlacingCall(true)
    setCallResult(null)

    try {
      // Get mock user data for testing
      const mockUserStats = {
        streak: 5,
        walletBalance: 100,
        totalMotivationalCalls: 0
      }

      const mockSetupData = {
        gymLocation: { name: 'Test Gym' },
        workoutTime: '18:00 - 19:00'
      }

      const result = await triggerMotivationalCall(testPhoneNumber, mockUserStats, mockSetupData)
      setCallResult(result)
    } catch (error) {
      setCallResult({
        success: false,
        message: `Call test failed: ${error.message}`
      })
    } finally {
      setIsPlacingCall(false)
    }
  }

  const handleMinimalTest = async () => {
    if (!testPhoneNumber) {
      alert('Please enter a phone number to test')
      return
    }

    setIsPlacingCall(true)
    setCallResult(null)

    try {
      const result = await testMinimalCall(testPhoneNumber)
      setCallResult(result)
    } catch (error) {
      setCallResult({
        success: false,
        message: `Minimal test failed: ${error.message}`
      })
    } finally {
      setIsPlacingCall(false)
    }
  }

  const handleViewCallLogs = () => {
    const logs = getCallLogs()
    setCallLogs(logs)
    setShowCallLogs(true)
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">🤖 Retell AI & Penalty Testing</h3>

      <div className="space-y-6">

        {/* Penalty Simulation */}
        <div>
          <h4 className="text-md font-medium text-white mb-2">💸 Penalty Simulation</h4>
          <p className="text-gray-400 text-sm mb-3">
            Simulate a missed workout penalty to see how the bet system works
          </p>
          <button
            onClick={handleSimulatePenalty}
            disabled={isSimulatingPenalty}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition duration-200"
          >
            {isSimulatingPenalty ? 'Applying Penalty...' : 'Simulate Missed Workout Penalty'}
          </button>

          {penaltyResult && (
            <div className={`mt-3 p-3 rounded-lg ${
              penaltyResult.success ? 'bg-red-900 border border-red-700' : 'bg-gray-900 border border-gray-700'
            }`}>
              <p className={penaltyResult.success ? 'text-red-200' : 'text-gray-200'}>
                {penaltyResult.success ? '💸' : '❌'} {penaltyResult.message}
              </p>
              {penaltyResult.details && (
                <div className="mt-2 text-sm text-red-300 space-y-1">
                  <p>Original Balance: ${penaltyResult.details.originalBalance}</p>
                  <p>Penalty (10%): -${penaltyResult.details.penaltyAmount}</p>
                  <p>Shopping Credit (20%): +${penaltyResult.details.shoppingCredit}</p>
                  <p>New Balance: ${penaltyResult.details.newBalance}</p>
                  <p className="text-yellow-300 mt-2">Dashboard will refresh in 2 seconds...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call Test */}
        <div>
          <h4 className="text-md font-medium text-white mb-2">📞 Motivational Call Test</h4>
          <div className="space-y-2">
            <input
              type="tel"
              placeholder="Enter phone number (e.g., +1234567890)"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleTestCall}
                disabled={isPlacingCall || !testPhoneNumber}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition duration-200"
              >
                {isPlacingCall ? 'Placing Call...' : 'Test Motivational Call'}
              </button>
              <button
                onClick={handleMinimalTest}
                disabled={isPlacingCall || !testPhoneNumber}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white rounded-lg transition duration-200"
              >
                Minimal Test
              </button>
            </div>
          </div>
          
          {callResult && (
            <div className={`mt-2 p-3 rounded-lg ${
              callResult.success ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'
            }`}>
              <p className={callResult.success ? 'text-green-200' : 'text-red-200'}>
                {callResult.success ? '✅' : '❌'} {callResult.message}
              </p>
              {callResult.callId && (
                <p className="text-sm text-green-300 mt-1">
                  Call ID: {callResult.callId}
                </p>
              )}
              {callResult.error && (
                <p className="text-sm text-red-300 mt-1">
                  Error: {callResult.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Call Logs */}
        <div>
          <button
            onClick={handleViewCallLogs}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
          >
            View Call Logs ({getCallLogs().length})
          </button>
        </div>
      </div>

      {/* Call Logs Modal */}
      {showCallLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Call Logs</h3>
              <button
                onClick={() => setShowCallLogs(false)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition duration-200"
              >
                Close
              </button>
            </div>
            
            {callLogs.length === 0 ? (
              <p className="text-gray-400">No call logs yet</p>
            ) : (
              <div className="space-y-3">
                {callLogs.map((log, index) => (
                  <div key={index} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-medium">
                        {log.phoneNumber}
                      </span>
                      <span className={`text-sm ${log.success ? 'text-green-400' : 'text-red-400'}`}>
                        {log.success ? '✅ Success' : '❌ Failed'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      <p>Time: {new Date(log.timestamp).toLocaleString()}</p>
                      {log.callId && <p>Call ID: {log.callId}</p>}
                      {log.error && <p className="text-red-300">Error: {log.error}</p>}
                      {log.userContext && (
                        <p>User: {log.userContext.userName} | Bet: ${log.userContext.betAmount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RetellAITester
