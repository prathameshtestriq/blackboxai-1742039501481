import { useState, useCallback, useRef } from 'react';
import useMarketData from './useMarketData';
import useWallet from './useWallet';
import useAuth from './useAuth';
import useAnalytics from './useAnalytics';
import useNotifications from './useNotifications';
import useError from './useError';

const TRADE_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
};

const ORDER_TYPES = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
  STOP: 'STOP',
};

const useTrading = (options = {}) => {
  const {
    symbol,
    enableLimitOrders = true,
    enableStopLoss = true,
    maxLeverage = 1,
    tradingFeePercent = 0.1,
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const orderBookRef = useRef(new Map());

  const marketData = useMarketData({ symbol });
  const wallet = useWallet();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { showNotification } = useNotifications();
  const { handleError } = useError();

  // Calculate trading fees
  const calculateFees = useCallback((amount) => {
    return (amount * tradingFeePercent) / 100;
  }, [tradingFeePercent]);

  // Validate trade
  const validateTrade = useCallback((tradeDetails) => {
    const {
      type,
      amount,
      price,
      orderType = ORDER_TYPES.MARKET,
    } = tradeDetails;

    try {
      // Check basic requirements
      if (!symbol || !type || !amount) {
        throw new Error('Invalid trade parameters');
      }

      // Check order type requirements
      if (orderType !== ORDER_TYPES.MARKET && !price) {
        throw new Error('Price required for limit and stop orders');
      }

      // Check wallet balance
      const fees = calculateFees(amount);
      const totalRequired = amount + fees;

      if (type === TRADE_TYPES.BUY && totalRequired > wallet.balance) {
        throw new Error('Insufficient funds');
      }

      // Check position size for selling
      if (type === TRADE_TYPES.SELL) {
        const position = orderBookRef.current.get(symbol);
        if (!position || position.quantity < amount) {
          throw new Error('Insufficient position');
        }
      }

      // Check leverage limits
      const leverage = amount / wallet.balance;
      if (leverage > maxLeverage) {
        throw new Error(`Leverage exceeds maximum (${maxLeverage}x)`);
      }

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [symbol, wallet.balance, maxLeverage, calculateFees, handleError]);

  // Execute market order
  const executeMarketOrder = useCallback(async (tradeDetails) => {
    const {
      type,
      amount,
    } = tradeDetails;

    try {
      setIsProcessing(true);

      // Get current market price
      const price = marketData.price;
      if (!price) {
        throw new Error('Unable to get market price');
      }

      // Calculate total and fees
      const total = amount * price;
      const fees = calculateFees(total);

      // Execute trade
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          type,
          amount,
          price,
          fees,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Trade execution failed');
      }

      const trade = await response.json();

      // Update order book
      updateOrderBook(trade);

      // Update wallet
      await wallet.updateBalance();

      // Track event
      trackEvent('trade_executed', {
        symbol,
        type,
        amount,
        price,
        fees,
      });

      // Show notification
      showNotification({
        type: 'success',
        message: `${type} order executed successfully`,
      });

      return trade;
    } catch (error) {
      handleError(error);
      showNotification({
        type: 'error',
        message: `Trade failed: ${error.message}`,
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [
    symbol,
    user,
    marketData,
    wallet,
    calculateFees,
    trackEvent,
    showNotification,
    handleError,
  ]);

  // Place limit order
  const placeLimitOrder = useCallback(async (tradeDetails) => {
    if (!enableLimitOrders) {
      throw new Error('Limit orders not enabled');
    }

    const {
      type,
      amount,
      price,
    } = tradeDetails;

    try {
      setIsProcessing(true);

      // Validate limit price
      const currentPrice = marketData.price;
      if (type === TRADE_TYPES.BUY && price > currentPrice) {
        throw new Error('Limit buy price must be below market price');
      }
      if (type === TRADE_TYPES.SELL && price < currentPrice) {
        throw new Error('Limit sell price must be above market price');
      }

      // Place order
      const response = await fetch('/api/orders/limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          type,
          amount,
          price,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place limit order');
      }

      const order = await response.json();

      // Add to pending orders
      setPendingOrders(prev => [...prev, order]);

      // Track event
      trackEvent('limit_order_placed', {
        symbol,
        type,
        amount,
        price,
      });

      // Show notification
      showNotification({
        type: 'success',
        message: `Limit order placed successfully`,
      });

      return order;
    } catch (error) {
      handleError(error);
      showNotification({
        type: 'error',
        message: `Failed to place limit order: ${error.message}`,
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [
    symbol,
    user,
    marketData,
    enableLimitOrders,
    trackEvent,
    showNotification,
    handleError,
  ]);

  // Place stop loss order
  const placeStopLossOrder = useCallback(async (tradeDetails) => {
    if (!enableStopLoss) {
      throw new Error('Stop loss not enabled');
    }

    const {
      amount,
      price,
    } = tradeDetails;

    try {
      setIsProcessing(true);

      // Validate stop price
      const currentPrice = marketData.price;
      if (price >= currentPrice) {
        throw new Error('Stop price must be below current price');
      }

      // Place order
      const response = await fetch('/api/orders/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          type: TRADE_TYPES.SELL,
          amount,
          price,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place stop loss');
      }

      const order = await response.json();

      // Add to pending orders
      setPendingOrders(prev => [...prev, order]);

      // Track event
      trackEvent('stop_loss_placed', {
        symbol,
        amount,
        price,
      });

      // Show notification
      showNotification({
        type: 'success',
        message: `Stop loss placed successfully`,
      });

      return order;
    } catch (error) {
      handleError(error);
      showNotification({
        type: 'error',
        message: `Failed to place stop loss: ${error.message}`,
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [
    symbol,
    user,
    marketData,
    enableStopLoss,
    trackEvent,
    showNotification,
    handleError,
  ]);

  // Cancel order
  const cancelOrder = useCallback(async (orderId) => {
    try {
      setIsProcessing(true);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      // Remove from pending orders
      setPendingOrders(prev => prev.filter(order => order.id !== orderId));

      // Track event
      trackEvent('order_cancelled', {
        orderId,
      });

      // Show notification
      showNotification({
        type: 'success',
        message: 'Order cancelled successfully',
      });

      return true;
    } catch (error) {
      handleError(error);
      showNotification({
        type: 'error',
        message: `Failed to cancel order: ${error.message}`,
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [trackEvent, showNotification, handleError]);

  // Update order book
  const updateOrderBook = useCallback((trade) => {
    const currentPosition = orderBookRef.current.get(symbol) || {
      quantity: 0,
      averagePrice: 0,
    };

    if (trade.type === TRADE_TYPES.BUY) {
      const newQuantity = currentPosition.quantity + trade.amount;
      const newTotal = (currentPosition.quantity * currentPosition.averagePrice) +
        (trade.amount * trade.price);
      
      orderBookRef.current.set(symbol, {
        quantity: newQuantity,
        averagePrice: newTotal / newQuantity,
      });
    } else {
      const newQuantity = currentPosition.quantity - trade.amount;
      if (newQuantity > 0) {
        orderBookRef.current.set(symbol, {
          quantity: newQuantity,
          averagePrice: currentPosition.averagePrice,
        });
      } else {
        orderBookRef.current.delete(symbol);
      }
    }
  }, [symbol]);

  // Get position
  const getPosition = useCallback(() => {
    return orderBookRef.current.get(symbol);
  }, [symbol]);

  return {
    // Trading operations
    executeMarketOrder,
    placeLimitOrder,
    placeStopLossOrder,
    cancelOrder,

    // Position info
    getPosition,
    pendingOrders,

    // Market data
    currentPrice: marketData.price,
    priceChange: marketData.priceChange,

    // State
    isProcessing,

    // Constants
    TRADE_TYPES,
    ORDER_TYPES,
  };
};

// Example usage with player trading
export const usePlayerTrading = (playerId) => {
  const trading = useTrading({
    symbol: `PLAYER:${playerId}`,
    enableLimitOrders: true,
    enableStopLoss: true,
  });

  const getPlayerStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/players/${playerId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch player stats');
      return await response.json();
    } catch (error) {
      console.error('Get player stats error:', error);
      return null;
    }
  }, [playerId]);

  return {
    ...trading,
    getPlayerStats,
  };
};

// Example usage with match trading
export const useMatchTrading = (matchId) => {
  const trading = useTrading({
    symbol: `MATCH:${matchId}`,
    enableLimitOrders: false,
    enableStopLoss: false,
  });

  const getMatchOdds = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/odds`);
      if (!response.ok) throw new Error('Failed to fetch match odds');
      return await response.json();
    } catch (error) {
      console.error('Get match odds error:', error);
      return null;
    }
  }, [matchId]);

  return {
    ...trading,
    getMatchOdds,
  };
};

export default useTrading;
