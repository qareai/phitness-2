import { useState, useEffect } from 'react'

function WalletStatus() {
  const [walletData, setWalletData] = useState(null)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    loadWalletData()
    
    // Refresh wallet data every 5 seconds
    const interval = setInterval(loadWalletData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadWalletData = () => {
    try {
      const stats = JSON.parse(localStorage.getItem('stayHardStats') || '{}')
      const transactionHistory = JSON.parse(localStorage.getItem('stayHardTransactions') || '[]')
      
      setWalletData(stats)
      setTransactions(transactionHistory.slice(0, 3)) // Show last 3 transactions
    } catch (error) {
      console.error('Failed to load wallet data:', error)
    }
  }

  const calculatePenaltyPreview = () => {
    if (!walletData?.walletBalance) return { penalty: 0, shopping: 0 }
    
    const penalty = Math.round(walletData.walletBalance * 0.1)
    const shopping = Math.round(walletData.walletBalance * 0.2)
    
    return { penalty, shopping }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'penalty_simulation':
      case 'deduction':
        return '💸'
      case 'credit':
        return '💰'
      case 'initial':
        return '🏦'
      default:
        return '📝'
    }
  }

  if (!walletData) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">💳 Wallet Status</h3>
        <p className="text-gray-400">Loading wallet data...</p>
      </div>
    )
  }

  const penaltyPreview = calculatePenaltyPreview()

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">💳 Wallet Status</h3>
      
      {/* Current Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-1">Bet Balance</h4>
          <p className="text-2xl font-bold text-yellow-400">
            ${walletData.walletBalance || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Money at stake</p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-1">Shopping Credits</h4>
          <p className="text-2xl font-bold text-green-400">
            ${walletData.shoppingBalance || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Earned from penalties</p>
        </div>
      </div>

      {/* Penalty Preview */}
      <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-red-200 mb-2">⚠️ Next Penalty Preview</h4>
        <div className="text-sm text-red-300 space-y-1">
          <p>If you miss your next workout:</p>
          <p>• Penalty deduction: <span className="font-semibold">-${penaltyPreview.penalty}</span></p>
          <p>• Shopping credit: <span className="font-semibold">+${penaltyPreview.shopping}</span></p>
          <p>• Streak reset to: <span className="font-semibold">0 days</span></p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h4 className="text-sm font-medium text-white mb-3">Recent Transactions</h4>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getTransactionIcon(transaction.type)}</span>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {transaction.description || 'Transaction'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(transaction.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'deduction' || transaction.type === 'penalty_simulation' 
                      ? 'text-red-400' 
                      : 'text-green-400'
                  }`}>
                    {transaction.type === 'deduction' || transaction.type === 'penalty_simulation' ? '-' : '+'}
                    ${transaction.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-xs">Total Penalties</p>
            <p className="text-red-400 font-semibold">
              ${walletData.totalPenalties || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Total Shopping Credits</p>
            <p className="text-green-400 font-semibold">
              ${walletData.totalShoppingCredits || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WalletStatus
