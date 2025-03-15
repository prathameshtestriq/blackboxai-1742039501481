import { useState, useCallback, useEffect } from 'react';
import useAuth from './useAuth';
import useApi from './useApi';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';
import useNotifications from './useNotifications';
import useError from './useError';

const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  TRADE: 'TRADE',
  BONUS: 'BONUS',
  REFERRAL: 'REFERRAL',
};

const useWallet = (options = {}) => {
  const {
    storageKey = '@Wallet',
    minTransactionAmount = 100,
    maxTransactionAmount = 1000000,
    dailyWithdrawalLimit = 50000,
  } = options;

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState([]);

  const { user } = useAuth();
  const api = useApi();
  const storage = useStorage(storageKey);
  const { trackEvent } = useAnalytics();
  const { showNotification } = useNotifications();
  const { handleError } = useError();

  // Load wallet data
  const loadWallet = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get wallet data from API
      const response = await api.get(`/wallet/${user.id}`);
      const walletData = response.data;

      setBalance(walletData.balance);
      setTransactions(walletData.transactions);

      // Cache wallet data
      await storage.setItem('wallet', walletData);

      trackEvent('wallet_loaded', {
        balance: walletData.balance,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user.id, api, storage, trackEvent, handleError]);

  // Update balance
  const updateBalance = useCallback(async () => {
    try {
      const response = await api.get(`/wallet/${user.id}/balance`);
      const newBalance = response.data.balance;

      setBalance(newBalance);
      
      trackEvent('balance_updated', {
        balance: newBalance,
      });

      return newBalance;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [user.id, api, trackEvent, handleError]);

  // Validate transaction
  const validateTransaction = useCallback((type, amount) => {
    try {
      // Check amount limits
      if (amount < minTransactionAmount) {
        throw new Error(`Minimum transaction amount is ${minTransactionAmount}`);
      }
      if (amount > maxTransactionAmount) {
        throw new Error(`Maximum transaction amount is ${maxTransactionAmount}`);
      }

      // Check withdrawal specific limits
      if (type === TRANSACTION_TYPES.WITHDRAWAL) {
        // Check balance
        if (amount > balance) {
          throw new Error('Insufficient balance');
        }

        // Check daily withdrawal limit
        const todayWithdrawals = transactions
          .filter(tx => 
            tx.type === TRANSACTION_TYPES.WITHDRAWAL &&
            new Date(tx.timestamp).toDateString() === new Date().toDateString()
          )
          .reduce((sum, tx) => sum + tx.amount, 0);

        if (todayWithdrawals + amount > dailyWithdrawalLimit) {
          throw new Error(`Daily withdrawal limit (${dailyWithdrawalLimit}) exceeded`);
        }
      }

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [
    balance,
    transactions,
    minTransactionAmount,
    maxTransactionAmount,
    dailyWithdrawalLimit,
    handleError,
  ]);

  // Process transaction
  const processTransaction = useCallback(async (type, amount, details = {}) => {
    try {
      // Validate transaction
      if (!validateTransaction(type, amount)) {
        return null;
      }

      setIsLoading(true);

      // Create transaction
      const response = await api.post('/transactions', {
        userId: user.id,
        type,
        amount,
        ...details,
      });

      const transaction = response.data;

      // Update local state
      setTransactions(prev => [transaction, ...prev]);
      await updateBalance();

      // Track event
      trackEvent('transaction_processed', {
        type,
        amount,
        ...details,
      });

      // Show notification
      showNotification({
        type: 'success',
        message: `${type} processed successfully`,
      });

      return transaction;
    } catch (error) {
      handleError(error);
      showNotification({
        type: 'error',
        message: `Transaction failed: ${error.message}`,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    user.id,
    api,
    validateTransaction,
    updateBalance,
    trackEvent,
    showNotification,
    handleError,
  ]);

  // Deposit funds
  const deposit = useCallback(async (amount, method) => {
    return processTransaction(TRANSACTION_TYPES.DEPOSIT, amount, { method });
  }, [processTransaction]);

  // Withdraw funds
  const withdraw = useCallback(async (amount, bankDetails) => {
    return processTransaction(TRANSACTION_TYPES.WITHDRAWAL, amount, { bankDetails });
  }, [processTransaction]);

  // Get transaction history
  const getTransactionHistory = useCallback(async (filters = {}) => {
    try {
      const response = await api.get('/transactions', { params: filters });
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  }, [api, handleError]);

  // Get pending transactions
  const getPendingTransactions = useCallback(async () => {
    try {
      const response = await api.get('/transactions/pending');
      setPendingTransactions(response.data);
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  }, [api, handleError]);

  // Calculate portfolio value
  const getPortfolioValue = useCallback(async () => {
    try {
      const response = await api.get(`/wallet/${user.id}/portfolio`);
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [user.id, api, handleError]);

  // Get wallet statistics
  const getWalletStats = useCallback(async () => {
    try {
      const response = await api.get(`/wallet/${user.id}/stats`);
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [user.id, api, handleError]);

  // Initialize wallet
  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  return {
    // Wallet state
    balance,
    transactions,
    pendingTransactions,
    isLoading,

    // Transaction operations
    deposit,
    withdraw,
    processTransaction,

    // Information retrieval
    getTransactionHistory,
    getPendingTransactions,
    getPortfolioValue,
    getWalletStats,
    updateBalance,

    // Constants
    TRANSACTION_TYPES,
  };
};

// Example usage with trading wallet
export const useTradingWallet = () => {
  const wallet = useWallet({
    minTransactionAmount: 1000,
    maxTransactionAmount: 1000000,
    dailyWithdrawalLimit: 100000,
  });

  const calculatePnL = useCallback(async () => {
    try {
      const response = await fetch(`/api/wallet/pnl`);
      if (!response.ok) throw new Error('Failed to calculate P&L');
      return await response.json();
    } catch (error) {
      console.error('Calculate P&L error:', error);
      return null;
    }
  }, []);

  return {
    ...wallet,
    calculatePnL,
  };
};

// Example usage with rewards wallet
export const useRewardsWallet = () => {
  const wallet = useWallet({
    minTransactionAmount: 100,
    maxTransactionAmount: 50000,
  });

  const claimReward = useCallback(async (rewardId) => {
    try {
      const response = await fetch(`/api/rewards/${rewardId}/claim`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to claim reward');
      return await response.json();
    } catch (error) {
      console.error('Claim reward error:', error);
      return null;
    }
  }, []);

  return {
    ...wallet,
    claimReward,
  };
};

export default useWallet;
