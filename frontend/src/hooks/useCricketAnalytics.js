import { useState, useCallback, useEffect } from 'react';
import useMarketData from './useMarketData';
import useCache from './useCache';
import useAnalytics from './useAnalytics';
import useError from './useError';

const PERFORMANCE_METRICS = {
  BATTING: [
    'RUNS',
    'AVERAGE',
    'STRIKE_RATE',
    'BOUNDARIES',
    'CONSISTENCY',
  ],
  BOWLING: [
    'WICKETS',
    'ECONOMY',
    'AVERAGE',
    'STRIKE_RATE',
    'CONSISTENCY',
  ],
  FIELDING: [
    'CATCHES',
    'RUN_OUTS',
    'STUMPING',
    'EFFICIENCY',
  ],
};

const useCricketAnalytics = (options = {}) => {
  const {
    cacheTime = 300000, // 5 minutes
    refreshInterval = 60000, // 1 minute
  } = options;

  const [playerStats, setPlayerStats] = useState({});
  const [matchPredictions, setMatchPredictions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const marketData = useMarketData();
  const cache = useCache();
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Calculate player performance score
  const calculatePerformanceScore = useCallback((stats) => {
    try {
      const {
        batting = {},
        bowling = {},
        fielding = {},
        recentForm = [],
        matchImportance = 1,
      } = stats;

      // Batting score (40% weight)
      const battingScore = (
        (batting.average * 0.3) +
        (batting.strikeRate * 0.3) +
        (batting.consistency * 0.2) +
        (batting.recentForm * 0.2)
      ) * 0.4;

      // Bowling score (40% weight)
      const bowlingScore = (
        (bowling.average * 0.3) +
        (bowling.economy * 0.3) +
        (bowling.consistency * 0.2) +
        (bowling.recentForm * 0.2)
      ) * 0.4;

      // Fielding score (20% weight)
      const fieldingScore = (
        (fielding.catches * 0.4) +
        (fielding.runOuts * 0.3) +
        (fielding.efficiency * 0.3)
      ) * 0.2;

      // Recent form adjustment
      const formAdjustment = recentForm.reduce((sum, match, index) => {
        const weight = 1 - (index * 0.2); // More recent matches have higher weight
        return sum + (match.performance * weight);
      }, 0) / recentForm.length;

      // Final score with match importance multiplier
      return (battingScore + bowlingScore + fieldingScore + formAdjustment) * matchImportance;
    } catch (error) {
      handleError(error);
      return 0;
    }
  }, [handleError]);

  // Get player analytics
  const getPlayerAnalytics = useCallback(async (playerId) => {
    try {
      // Check cache first
      const cached = await cache.getItem(`player_analytics:${playerId}`);
      if (cached) return cached;

      const response = await fetch(`/api/analytics/players/${playerId}`);
      if (!response.ok) throw new Error('Failed to get player analytics');

      const analytics = await response.json();
      
      // Calculate performance score
      analytics.performanceScore = calculatePerformanceScore(analytics);

      // Cache results
      await cache.setItem(`player_analytics:${playerId}`, analytics, cacheTime);

      trackEvent('player_analytics_fetched', {
        playerId,
        performanceScore: analytics.performanceScore,
      });

      return analytics;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [cache, cacheTime, calculatePerformanceScore, trackEvent, handleError]);

  // Get match analytics
  const getMatchAnalytics = useCallback(async (matchId) => {
    try {
      // Check cache first
      const cached = await cache.getItem(`match_analytics:${matchId}`);
      if (cached) return cached;

      const response = await fetch(`/api/analytics/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to get match analytics');

      const analytics = await response.json();

      // Cache results
      await cache.setItem(`match_analytics:${matchId}`, analytics, cacheTime);

      trackEvent('match_analytics_fetched', {
        matchId,
      });

      return analytics;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [cache, cacheTime, trackEvent, handleError]);

  // Predict match outcome
  const predictMatchOutcome = useCallback(async (matchId) => {
    try {
      const analytics = await getMatchAnalytics(matchId);
      if (!analytics) return null;

      const {
        team1Stats,
        team2Stats,
        conditions,
        headToHead,
      } = analytics;

      // Calculate win probabilities based on various factors
      const prediction = {
        team1Probability: 0,
        team2Probability: 0,
        confidenceScore: 0,
        keyFactors: [],
      };

      // Team strength comparison (40% weight)
      const team1Strength = calculateTeamStrength(team1Stats);
      const team2Strength = calculateTeamStrength(team2Stats);
      const strengthDiff = team1Strength - team2Strength;
      
      prediction.team1Probability += (strengthDiff > 0 ? strengthDiff : 0) * 0.4;
      prediction.team2Probability += (strengthDiff < 0 ? -strengthDiff : 0) * 0.4;

      // Head to head record (30% weight)
      const h2hFactor = calculateH2HFactor(headToHead);
      prediction.team1Probability += h2hFactor.team1 * 0.3;
      prediction.team2Probability += h2hFactor.team2 * 0.3;

      // Conditions and other factors (30% weight)
      const conditionsFactor = analyzeConditions(conditions);
      prediction.team1Probability += conditionsFactor.team1 * 0.3;
      prediction.team2Probability += conditionsFactor.team2 * 0.3;

      // Normalize probabilities
      const total = prediction.team1Probability + prediction.team2Probability;
      prediction.team1Probability = (prediction.team1Probability / total) * 100;
      prediction.team2Probability = (prediction.team2Probability / total) * 100;

      // Calculate confidence score
      prediction.confidenceScore = calculateConfidenceScore(prediction);

      return prediction;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [getMatchAnalytics, handleError]);

  // Get player rankings
  const getPlayerRankings = useCallback(async (category = 'OVERALL') => {
    try {
      const response = await fetch(`/api/analytics/rankings/${category}`);
      if (!response.ok) throw new Error('Failed to get player rankings');

      const rankings = await response.json();
      return rankings;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError]);

  // Get performance trends
  const getPerformanceTrends = useCallback(async (playerId, period = '1Y') => {
    try {
      const response = await fetch(
        `/api/analytics/trends/${playerId}?period=${period}`
      );
      if (!response.ok) throw new Error('Failed to get performance trends');

      const trends = await response.json();
      return trends;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError]);

  // Get market sentiment
  const getMarketSentiment = useCallback(async (symbol) => {
    try {
      const response = await fetch(`/api/analytics/sentiment/${symbol}`);
      if (!response.ok) throw new Error('Failed to get market sentiment');

      const sentiment = await response.json();
      return sentiment;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError]);

  // Helper functions
  const calculateTeamStrength = useCallback((teamStats) => {
    // Implementation of team strength calculation
    return 0;
  }, []);

  const calculateH2HFactor = useCallback((h2hStats) => {
    // Implementation of head to head factor calculation
    return { team1: 0, team2: 0 };
  }, []);

  const analyzeConditions = useCallback((conditions) => {
    // Implementation of conditions analysis
    return { team1: 0, team2: 0 };
  }, []);

  const calculateConfidenceScore = useCallback((prediction) => {
    // Implementation of confidence score calculation
    return 0;
  }, []);

  return {
    // Analytics functions
    getPlayerAnalytics,
    getMatchAnalytics,
    predictMatchOutcome,
    getPlayerRankings,
    getPerformanceTrends,
    getMarketSentiment,

    // State
    playerStats,
    matchPredictions,
    isLoading,

    // Constants
    PERFORMANCE_METRICS,
  };
};

// Example usage with player performance
export const usePlayerPerformance = (playerId) => {
  const analytics = useCricketAnalytics();

  const getDetailedStats = useCallback(async () => {
    const [
      playerAnalytics,
      performanceTrends,
      marketSentiment,
    ] = await Promise.all([
      analytics.getPlayerAnalytics(playerId),
      analytics.getPerformanceTrends(playerId),
      analytics.getMarketSentiment(`PLAYER:${playerId}`),
    ]);

    return {
      analytics: playerAnalytics,
      trends: performanceTrends,
      sentiment: marketSentiment,
    };
  }, [playerId, analytics]);

  return {
    ...analytics,
    getDetailedStats,
  };
};

// Example usage with match analysis
export const useMatchAnalysis = (matchId) => {
  const analytics = useCricketAnalytics();

  const getMatchInsights = useCallback(async () => {
    const [
      matchAnalytics,
      prediction,
      sentiment,
    ] = await Promise.all([
      analytics.getMatchAnalytics(matchId),
      analytics.predictMatchOutcome(matchId),
      analytics.getMarketSentiment(`MATCH:${matchId}`),
    ]);

    return {
      analytics: matchAnalytics,
      prediction,
      sentiment,
    };
  }, [matchId, analytics]);

  return {
    ...analytics,
    getMatchInsights,
  };
};

export default useCricketAnalytics;
