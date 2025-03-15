import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import useApi from './useApi';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';

const useSearch = (options = {}) => {
  const {
    endpoint,
    initialQuery = '',
    debounceTime = 300,
    minQueryLength = 2,
    maxResults = 10,
    maxRecentSearches = 5,
    storageKey = 'recent_searches',
    onSearch,
    onError,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const api = useApi(endpoint);
  const storage = useStorage(storageKey);
  const { trackEvent } = useAnalytics();
  const abortControllerRef = useRef(null);

  // Store recent searches
  const recentSearches = useRef([]);

  // Load recent searches from storage
  useEffect(() => {
    const loadRecentSearches = async () => {
      const stored = await storage.value;
      if (stored) {
        recentSearches.current = stored;
      }
    };

    loadRecentSearches();
  }, [storage]);

  // Save recent search
  const saveRecentSearch = useCallback(async (searchQuery) => {
    try {
      // Remove duplicate if exists
      const filtered = recentSearches.current.filter(
        item => item.query !== searchQuery
      );

      // Add new search to beginning
      const newSearches = [
        { query: searchQuery, timestamp: Date.now() },
        ...filtered,
      ].slice(0, maxRecentSearches);

      recentSearches.current = newSearches;
      await storage.setValue(newSearches);

      return true;
    } catch (error) {
      console.error('Save recent search error:', error);
      return false;
    }
  }, [storage, maxRecentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(async () => {
    try {
      recentSearches.current = [];
      await storage.remove();
      return true;
    } catch (error) {
      console.error('Clear recent searches error:', error);
      return false;
    }
  }, [storage]);

  // Perform search
  const performSearch = useCallback(async (searchQuery) => {
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    setError(null);

    try {
      const response = await api.get({
        params: {
          q: searchQuery,
          limit: maxResults,
        },
        signal: abortControllerRef.current.signal,
      });

      if (response) {
        setResults(response.data);
        setSuggestions(response.suggestions || []);
        await saveRecentSearch(searchQuery);
        
        trackEvent('search_performed', {
          query: searchQuery,
          resultCount: response.data.length,
        });

        if (onSearch) {
          onSearch(response.data);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error);
        trackEvent('search_error', {
          query: searchQuery,
          error: error.message,
        });
        if (onError) {
          onError(error);
        }
      }
    } finally {
      setIsSearching(false);
    }
  }, [
    api,
    minQueryLength,
    maxResults,
    saveRecentSearch,
    trackEvent,
    onSearch,
    onError,
  ]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(performSearch, debounceTime),
    [performSearch, debounceTime]
  );

  // Handle query change
  const handleQueryChange = useCallback((searchQuery) => {
    setQuery(searchQuery);
    debouncedSearch(searchQuery);
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Filter results
  const filterResults = useCallback((filterFn) => {
    if (typeof filterFn === 'function') {
      setResults(current => current.filter(filterFn));
    }
  }, []);

  // Sort results
  const sortResults = useCallback((sortFn) => {
    if (typeof sortFn === 'function') {
      setResults(current => [...current].sort(sortFn));
    }
  }, []);

  return {
    // State
    query,
    results,
    suggestions,
    isSearching,
    error,
    recentSearches: recentSearches.current,

    // Actions
    handleQueryChange,
    clearSearch,
    clearRecentSearches,
    filterResults,
    sortResults,
  };
};

// Example usage with player search
export const usePlayerSearch = () => {
  const search = useSearch({
    endpoint: '/api/players/search',
    storageKey: 'player_searches',
  });

  const filterByTeam = useCallback((team) => {
    search.filterResults(player => player.team === team);
  }, [search]);

  const sortByPrice = useCallback((ascending = true) => {
    search.sortResults((a, b) => {
      const diff = a.stock.currentPrice - b.stock.currentPrice;
      return ascending ? diff : -diff;
    });
  }, [search]);

  return {
    ...search,
    filterByTeam,
    sortByPrice,
  };
};

// Example usage with match search
export const useMatchSearch = () => {
  const search = useSearch({
    endpoint: '/api/matches/search',
    storageKey: 'match_searches',
  });

  const filterByStatus = useCallback((status) => {
    search.filterResults(match => match.status === status);
  }, [search]);

  const sortByDate = useCallback((ascending = true) => {
    search.sortResults((a, b) => {
      const diff = new Date(a.startTime) - new Date(b.startTime);
      return ascending ? diff : -diff;
    });
  }, [search]);

  return {
    ...search,
    filterByStatus,
    sortByDate,
  };
};

export default useSearch;
