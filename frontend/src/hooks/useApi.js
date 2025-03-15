import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import api from '../services/api';

const useApi = (endpoint, options = {}) => {
  const {
    initialData = null,
    onSuccess,
    onError,
    autoLoad = false,
    transformResponse,
  } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef(null);
  const dispatch = useDispatch();

  // Cancel previous request if component unmounts or new request is made
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRequest();
    };
  }, [cancelRequest]);

  // Handle API response
  const handleResponse = useCallback(
    (response) => {
      const transformedData = transformResponse
        ? transformResponse(response.data)
        : response.data;
      setData(transformedData);
      setError(null);
      if (onSuccess) {
        onSuccess(transformedData);
      }
      return transformedData;
    },
    [transformResponse, onSuccess]
  );

  // Handle API error
  const handleError = useCallback(
    (err) => {
      // Don't set error if request was cancelled
      if (err.name === 'AbortError') {
        return;
      }

      const errorMessage =
        err.response?.data?.message || err.message || 'Something went wrong';
      setError(errorMessage);

      // Handle 401 Unauthorized error
      if (err.response?.status === 401) {
        dispatch(logout());
      }

      if (onError) {
        onError(err);
      }

      throw err;
    },
    [onError, dispatch]
  );

  // Make API request
  const request = useCallback(
    async (config = {}) => {
      cancelRequest();
      setIsLoading(true);
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await api({
          url: endpoint,
          signal: abortController.signal,
          ...config,
        });
        return handleResponse(response);
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [endpoint, handleResponse, handleError, cancelRequest]
  );

  // GET request
  const get = useCallback(
    async (params) => {
      return request({ method: 'GET', params });
    },
    [request]
  );

  // POST request
  const post = useCallback(
    async (data) => {
      return request({ method: 'POST', data });
    },
    [request]
  );

  // PUT request
  const put = useCallback(
    async (data) => {
      return request({ method: 'PUT', data });
    },
    [request]
  );

  // PATCH request
  const patch = useCallback(
    async (data) => {
      return request({ method: 'PATCH', data });
    },
    [request]
  );

  // DELETE request
  const remove = useCallback(
    async () => {
      return request({ method: 'DELETE' });
    },
    [request]
  );

  // Refresh data
  const refresh = useCallback(
    async (params) => {
      setIsRefreshing(true);
      try {
        await get(params);
      } finally {
        setIsRefreshing(false);
      }
    },
    [get]
  );

  // Load data on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      get();
    }
  }, [autoLoad, get]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    get,
    post,
    put,
    patch,
    remove,
    refresh,
    request,
    setData,
    setError,
  };
};

// Helper hook for paginated data
export const usePaginatedApi = (endpoint, options = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    ...apiOptions
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [hasMore, setHasMore] = useState(true);
  const [items, setItems] = useState([]);

  const api = useApi(endpoint, {
    ...apiOptions,
    transformResponse: (response) => {
      const { data, pagination } = response;
      setHasMore(pagination.page < pagination.totalPages);
      return data;
    },
  });

  // Load page
  const loadPage = useCallback(
    async (pageNumber = page) => {
      const response = await api.get({
        page: pageNumber,
        limit,
      });
      if (pageNumber === 1) {
        setItems(response);
      } else {
        setItems((prev) => [...prev, ...response]);
      }
      return response;
    },
    [api, page, limit]
  );

  // Load more items
  const loadMore = useCallback(async () => {
    if (!hasMore || api.isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadPage(nextPage);
  }, [api.isLoading, hasMore, page, loadPage]);

  // Refresh data
  const refresh = useCallback(async () => {
    setPage(1);
    await loadPage(1);
  }, [loadPage]);

  return {
    ...api,
    items,
    page,
    limit,
    hasMore,
    loadMore,
    refresh,
    setLimit,
  };
};

export default useApi;
