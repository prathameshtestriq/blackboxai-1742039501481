import { useState, useCallback, useEffect } from 'react';
import useWallet from './useWallet';
import useMarketData from './useMarketData';
import useTrading from './useTrading';
import useAnalytics from './useAnalytics';
import useStorage from './useStorage';
import useError from './useError';

const PORTFOLIO_TYPES = {
  PLAYERS: 'PLAYERS',
  MATCHES: 'MATCHES',
  MIXED: 'MIXED',
};

const SORT_TYPES = {
  VALUE: 'VALUE',
  PROFIT: 'PROFIT',
  PERFORMANCE: 'PERFORMANCE',
  RECENT: 'RECENT',
};

const usePortfolio = (options = {}) => {
  const {
    type = PORTFOLIO_TYPES.MIXED,
    storageKey = '@Portfolio',
    refreshInterval = 60000, // 1 minute
  } = options;

  const [holdings, setHoldings] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const wallet = useWallet();
  const marketData = useMarketData();
  const trading = useTrading();
  const storage = useStorage(storageKey);
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Load portfolio
  const loadPortfolio = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get portfolio data from API
      const response = await fetch('/api/portfolio');
      if (!response.ok) throw new Error('Failed to load portfolio');

      const portfolioData = await response.json();
      
      setHoldings(portfolioData.holdings);
      setTotalValue(portfolioData.totalValue);
      setTotalProfit(portfolioData.totalProfit);

      // Cache portfolio data
      await storage.setItem('portfolio', portfolioData);

      trackEvent('portfolio_loaded', {
        type,
        holdingsCount: portfolioData.holdings.length,
        totalValue: portfolioData.totalValue,
      });

      return portfolioData;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [type, storage, trackEvent, handleError]);

  // Update portfolio values
  const updateValues = useCallback(async () => {
    try {
      const updatedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          const currentPrice = await marketData.getPrice(holding.symbol);
          const value = holding.quantity * currentPrice;
          const profit = value - (holding.quantity * holding.averagePrice);
          
          return {
            ...holding,
            currentPrice,
            value,
            profit,
            profitPercentage: (profit / (holding.quantity * holding.averagePrice)) * 100,
          };
        })
      );

      setHoldings(updatedHoldings);
      setTotalValue(updatedHoldings.reduce((sum, h) => sum + h.value, 0));
      setTotalProfit(updatedHoldings.reduce((sum, h) => sum + h.profit, 0));

      trackEvent('portfolio_values_updated', {
        totalValue,
        totalProfit,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [holdings, marketData, totalValue, totalProfit, trackEvent, handleError]);

  // Get holding
  const getHolding = useCallback((symbol) => {
    return holdings.find(h => h.symbol === symbol);
  }, [holdings]);

  // Sort holdings
  const sortHoldings = useCallback((sortType = SORT_TYPES.VALUE) => {
    const sortedHoldings = [...holdings];

    switch (sortType) {
      case SORT_TYPES.VALUE:
        sortedHoldings.sort((a, b) => b.value - a.value);
        break;
      case SORT_TYPES.PROFIT:
        sortedHoldings.sort((a, b) => b.profit - a.profit);
        break;
      case SORT_TYPES.PERFORMANCE:
        sortedHoldings.sort((a, b) => b.profitPercentage - a.profitPercentage);
        break;
      case SORT_TYPES.RECENT:
        sortedHoldings.sort((a, b) => b.lastTradeTime - a.lastTradeTime);
        break;
    }

    setHoldings(sortedHoldings);
    return sortedHoldings;
  }, [holdings]);

  // Filter holdings
  const filterHoldings = useCallback((filters = {}) => {
    const {
      minValue = 0,
      minProfit,
      type: holdingType,
      search,
    } = filters;

    return holdings.filter(holding => {
      if (minValue && holding.value < minValue) return false;
      if (minProfit && holding.profit < minProfit) return false;
      if (holdingType && holding.type !== holdingType) return false;
      if (search && !holding.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [holdings]);

  // Get portfolio statistics
  const getStatistics = useCallback(() => {
    const stats = {
      totalHoldings: holdings.length,
      totalValue,
      totalProfit,
      profitPercentage: (totalProfit / (totalValue - totalProfit)) * 100,
      bestPerforming: null,
      worstPerforming: null,
    };

    if (holdings.length > 0) {
      stats.bestPerforming = holdings.reduce((best, current) => 
        current.profitPercentage > best.profitPercentage ? current : best
      );
      stats.worstPerforming = holdings.reduce((worst, current) => 
        current.profitPercentage < worst.profitPercentage ? current : worst
      );
    }

    return stats;
  }, [holdings, totalValue, totalProfit]);

  // Get portfolio allocation
  const getAllocation = useCallback(() => {
    return holdings.reduce((allocation, holding) => {
      const category = holding.type;
      if (!allocation[category]) {
        allocation[category] = {
          value: 0,
          percentage: 0,
          holdings: [],
        };
      }
      
      allocation[category].value += holding.value;
      allocation[category].holdings.push(holding);
      allocation[category].percentage = (allocation[category].value / totalValue) * 100;
      
      return allocation;
    }, {});
  }, [holdings, totalValue]);

  // Get portfolio performance
  const getPerformance = useCallback(async (period = '1M') => {
    try {
      const response = await fetch(`/api/portfolio/performance?period=${period}`);
      if (!response.ok) throw new Error('Failed to get portfolio performance');
      
      return await response.json();
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError]);

  // Rebalance portfolio
  const rebalancePortfolio = useCallback(async (targetAllocation) => {
    try {
      const currentAllocation = getAllocation();
      const rebalancingTrades = [];

      // Calculate required trades
      Object.entries(targetAllocation).forEach(([category, targetPercentage]) => {
        const current = currentAllocation[category];
        const targetValue = totalValue * (targetPercentage / 100);
        const difference = targetValue - (current?.value || 0);

        if (Math.abs(difference) > totalValue * 0.01) { // 1% threshold
          rebalancingTrades.push({
            category,
            action: difference > 0 ? 'BUY' : 'SELL',
            amount: Math.abs(difference),
          });
        }
      });

      // Execute rebalancing trades
      for (const trade of rebalancingTrades) {
        await trading.executeMarketOrder({
          type: trade.action,
          amount: trade.amount,
          category: trade.category,
        });
      }

      trackEvent('portfolio_rebalanced', {
        tradesCount: rebalancingTrades.length,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [getAllocation, totalValue, trading, trackEvent, handleError]);

  // Initialize portfolio
  useEffect(() => {
    loadPortfolio();

    // Set up periodic refresh
    const interval = setInterval(() => {
      updateValues();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [loadPortfolio, updateValues, refreshInterval]);

  return {
    // Portfolio data
    holdings,
    totalValue,
    totalProfit,
    isLoading,

    // Portfolio operations
    loadPortfolio,
    updateValues,
    getHolding,
    sortHoldings,
    filterHoldings,

    // Analysis
    getStatistics,
    getAllocation,
    getPerformance,
    rebalancePortfolio,

    // Constants
    PORTFOLIO_TYPES,
    SORT_TYPES,
  };
};

// Example usage with player portfolio
export const usePlayerPortfolio = () => {
  const portfolio = usePortfolio({
    type: PORTFOLIO_TYPES.PLAYERS,
  });

  const getPlayerPerformance = useCallback(async (playerId) => {
    try {
      const response = await fetch(`/api/players/${playerId}/performance`);
      if (!response.ok) throw new Error('Failed to get player performance');
      return await response.json();
    } catch (error) {
      console.error('Get player performance error:', error);
      return null;
    }
  }, []);

  return {
    ...portfolio,
    getPlayerPerformance,
  };
};

// Example usage with match portfolio
export const useMatchPortfolio = () => {
  const portfolio = usePortfolio({
    type: PORTFOLIO_TYPES.MATCHES,
  });

  const getMatchPredictions = useCallback(async (matchId) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/predictions`);
      if (!response.ok) throw new Error('Failed to get match predictions');
      return await response.json();
    } catch (error) {
      console.error('Get match predictions error:', error);
      return null;
    }
  }, []);

  return {
    ...portfolio,
    getMatchPredictions,
  };
};

export default usePortfolio;
