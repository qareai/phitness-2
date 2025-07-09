// Wallet and betting system manager

class WalletManager {
  constructor() {
    this.transactionHistory = []
    this.loadTransactionHistory()
  }

  // Load transaction history from localStorage
  loadTransactionHistory() {
    try {
      const history = localStorage.getItem('stayHardTransactions')
      this.transactionHistory = history ? JSON.parse(history) : []
    } catch (error) {
      console.error('Failed to load transaction history:', error)
      this.transactionHistory = []
    }
  }

  // Save transaction history to localStorage
  saveTransactionHistory() {
    try {
      localStorage.setItem('stayHardTransactions', JSON.stringify(this.transactionHistory))
    } catch (error) {
      console.error('Failed to save transaction history:', error)
    }
  }

  // Get current user stats
  getUserStats() {
    try {
      return JSON.parse(localStorage.getItem('stayHardStats') || '{}')
    } catch {
      return {}
    }
  }

  // Save user stats
  saveUserStats(stats) {
    localStorage.setItem('stayHardStats', JSON.stringify(stats))
  }

  // Add transaction to history
  addTransaction(type, amount, description, metadata = {}) {
    const transaction = {
      id: Date.now().toString(),
      type, // 'deduction', 'credit', 'transfer', 'initial'
      amount,
      description,
      metadata,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    }

    this.transactionHistory.unshift(transaction) // Add to beginning
    
    // Keep only last 100 transactions
    if (this.transactionHistory.length > 100) {
      this.transactionHistory = this.transactionHistory.slice(0, 100)
    }

    this.saveTransactionHistory()
    return transaction
  }

  // Initialize wallet with initial bet amount
  initializeWallet(initialBetAmount) {
    const userStats = this.getUserStats()
    
    const updatedStats = {
      ...userStats,
      walletBalance: initialBetAmount,
      shoppingBalance: 0,
      totalDeposited: initialBetAmount,
      totalPenalties: 0,
      totalShoppingCredits: 0
    }

    this.saveUserStats(updatedStats)
    
    this.addTransaction(
      'initial',
      initialBetAmount,
      'Initial bet deposit',
      { source: 'setup' }
    )

    return updatedStats
  }

  // Apply penalty for missed workout
  applyPenalty(penaltyPercentage = 0.1, shoppingCreditPercentage = 0.2) {
    const userStats = this.getUserStats()
    const currentBalance = userStats.walletBalance || 0

    if (currentBalance <= 0) {
      throw new Error('Insufficient balance for penalty')
    }

    const penaltyAmount = Math.round(currentBalance * penaltyPercentage)
    const shoppingCredit = Math.round(currentBalance * shoppingCreditPercentage)
    
    const updatedStats = {
      ...userStats,
      walletBalance: Math.max(0, currentBalance - penaltyAmount),
      shoppingBalance: (userStats.shoppingBalance || 0) + shoppingCredit,
      totalPenalties: (userStats.totalPenalties || 0) + penaltyAmount,
      totalShoppingCredits: (userStats.totalShoppingCredits || 0) + shoppingCredit,
      lastPenaltyDate: new Date().toISOString()
    }

    this.saveUserStats(updatedStats)

    // Record transactions
    this.addTransaction(
      'deduction',
      penaltyAmount,
      'Missed workout penalty',
      { 
        reason: 'missed_workout',
        originalBalance: currentBalance,
        penaltyPercentage 
      }
    )

    this.addTransaction(
      'credit',
      shoppingCredit,
      'Shopping credit from penalty',
      { 
        reason: 'penalty_conversion',
        sourceTransaction: 'missed_workout',
        conversionPercentage: shoppingCreditPercentage 
      }
    )

    return {
      penaltyAmount,
      shoppingCredit,
      newBalance: updatedStats.walletBalance,
      newShoppingBalance: updatedStats.shoppingBalance
    }
  }

  // Add funds to wallet
  addFunds(amount, description = 'Funds added') {
    const userStats = this.getUserStats()
    
    const updatedStats = {
      ...userStats,
      walletBalance: (userStats.walletBalance || 0) + amount,
      totalDeposited: (userStats.totalDeposited || 0) + amount
    }

    this.saveUserStats(updatedStats)
    
    this.addTransaction(
      'credit',
      amount,
      description,
      { source: 'manual_deposit' }
    )

    return updatedStats
  }

  // Use shopping credits
  useShoppingCredits(amount, description = 'Shopping purchase') {
    const userStats = this.getUserStats()
    const currentShoppingBalance = userStats.shoppingBalance || 0

    if (amount > currentShoppingBalance) {
      throw new Error('Insufficient shopping credits')
    }

    const updatedStats = {
      ...userStats,
      shoppingBalance: currentShoppingBalance - amount,
      totalShoppingSpent: (userStats.totalShoppingSpent || 0) + amount
    }

    this.saveUserStats(updatedStats)
    
    this.addTransaction(
      'deduction',
      amount,
      description,
      { 
        source: 'shopping_credits',
        type: 'shopping_purchase'
      }
    )

    return updatedStats
  }

  // Transfer shopping credits back to wallet (if allowed)
  transferShoppingToWallet(amount) {
    const userStats = this.getUserStats()
    const currentShoppingBalance = userStats.shoppingBalance || 0

    if (amount > currentShoppingBalance) {
      throw new Error('Insufficient shopping credits')
    }

    // Apply a small fee for transfer (e.g., 5%)
    const transferFee = Math.round(amount * 0.05)
    const netTransfer = amount - transferFee

    const updatedStats = {
      ...userStats,
      shoppingBalance: currentShoppingBalance - amount,
      walletBalance: (userStats.walletBalance || 0) + netTransfer,
      totalTransferFees: (userStats.totalTransferFees || 0) + transferFee
    }

    this.saveUserStats(updatedStats)
    
    this.addTransaction(
      'transfer',
      netTransfer,
      'Shopping credits to wallet',
      { 
        originalAmount: amount,
        transferFee,
        feePercentage: 0.05
      }
    )

    return updatedStats
  }

  // Get wallet summary
  getWalletSummary() {
    const userStats = this.getUserStats()
    
    return {
      walletBalance: userStats.walletBalance || 0,
      shoppingBalance: userStats.shoppingBalance || 0,
      totalBalance: (userStats.walletBalance || 0) + (userStats.shoppingBalance || 0),
      totalDeposited: userStats.totalDeposited || 0,
      totalPenalties: userStats.totalPenalties || 0,
      totalShoppingCredits: userStats.totalShoppingCredits || 0,
      totalShoppingSpent: userStats.totalShoppingSpent || 0,
      totalTransferFees: userStats.totalTransferFees || 0,
      lastPenaltyDate: userStats.lastPenaltyDate || null
    }
  }

  // Get transaction history
  getTransactionHistory(limit = 20) {
    return this.transactionHistory.slice(0, limit)
  }

  // Get transactions by type
  getTransactionsByType(type, limit = 10) {
    return this.transactionHistory
      .filter(transaction => transaction.type === type)
      .slice(0, limit)
  }

  // Get transactions by date range
  getTransactionsByDateRange(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return this.transactionHistory.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp)
      return transactionDate >= start && transactionDate <= end
    })
  }

  // Calculate penalty preview
  calculatePenaltyPreview(penaltyPercentage = 0.1, shoppingCreditPercentage = 0.2) {
    const userStats = this.getUserStats()
    const currentBalance = userStats.walletBalance || 0

    if (currentBalance <= 0) {
      return {
        canApplyPenalty: false,
        reason: 'Insufficient balance'
      }
    }

    const penaltyAmount = Math.round(currentBalance * penaltyPercentage)
    const shoppingCredit = Math.round(currentBalance * shoppingCreditPercentage)
    const remainingBalance = currentBalance - penaltyAmount

    return {
      canApplyPenalty: true,
      currentBalance,
      penaltyAmount,
      shoppingCredit,
      remainingBalance,
      penaltyPercentage,
      shoppingCreditPercentage
    }
  }

  // Reset wallet (for testing or account reset)
  resetWallet() {
    const userStats = this.getUserStats()
    
    const resetStats = {
      ...userStats,
      walletBalance: 0,
      shoppingBalance: 0,
      totalDeposited: 0,
      totalPenalties: 0,
      totalShoppingCredits: 0,
      totalShoppingSpent: 0,
      totalTransferFees: 0,
      lastPenaltyDate: null
    }

    this.saveUserStats(resetStats)
    this.transactionHistory = []
    this.saveTransactionHistory()

    return resetStats
  }
}

// Export singleton instance
export const walletManager = new WalletManager()

// Utility functions
export const initializeUserWallet = (initialAmount) => {
  return walletManager.initializeWallet(initialAmount)
}

export const applyWorkoutPenalty = () => {
  return walletManager.applyPenalty()
}

export const getWalletSummary = () => {
  return walletManager.getWalletSummary()
}

export const getRecentTransactions = (limit = 10) => {
  return walletManager.getTransactionHistory(limit)
}
