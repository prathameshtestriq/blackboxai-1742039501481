import { useState, useCallback, useRef, useEffect } from 'react';
import useNetwork from './useNetwork';
import useStorage from './useStorage';
import useCache from './useCache';
import useAnalytics from './useAnalytics';
import useError from './useError';

const useSync = (options = {}) => {
  const {
    syncInterval = 300000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 5000,
    syncStorageKey = '@Sync:status',
    queueStorageKey = '@Sync:queue',
  } = options;

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const syncInProgress = useRef(false);

  const network = useNetwork();
  const storage = useStorage();
  const cache = useCache();
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Initialize sync status
  const initializeSyncStatus = useCallback(async () => {
    try {
      const status = await storage.getItem(syncStorageKey);
      if (status) {
        setLastSyncTime(status.lastSyncTime);
        setPendingChanges(status.pendingChanges || []);
      }
    } catch (error) {
      handleError(error);
    }
  }, [storage, syncStorageKey, handleError]);

  // Save sync status
  const saveSyncStatus = useCallback(async () => {
    try {
      await storage.setItem(syncStorageKey, {
        lastSyncTime,
        pendingChanges,
      });
    } catch (error) {
      handleError(error);
    }
  }, [storage, syncStorageKey, lastSyncTime, pendingChanges, handleError]);

  // Add change to sync queue
  const queueChange = useCallback(async (change) => {
    try {
      const newChanges = [...pendingChanges, {
        ...change,
        timestamp: Date.now(),
        attempts: 0,
      }];
      setPendingChanges(newChanges);
      await saveSyncStatus();

      trackEvent('sync_change_queued', {
        type: change.type,
        entity: change.entity,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [pendingChanges, saveSyncStatus, trackEvent, handleError]);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (!network.isConnected || syncInProgress.current) return;

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const remainingChanges = [];

      for (const change of pendingChanges) {
        if (change.attempts >= retryAttempts) {
          trackEvent('sync_change_failed', {
            type: change.type,
            entity: change.entity,
            attempts: change.attempts,
          });
          continue;
        }

        try {
          await processChange(change);
          
          trackEvent('sync_change_processed', {
            type: change.type,
            entity: change.entity,
            attempts: change.attempts + 1,
          });
        } catch (error) {
          remainingChanges.push({
            ...change,
            attempts: change.attempts + 1,
            lastError: error.message,
          });
        }

        // Add delay between retries
        if (change.attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      setPendingChanges(remainingChanges);
      setLastSyncTime(Date.now());
      await saveSyncStatus();

    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [
    network.isConnected,
    pendingChanges,
    retryAttempts,
    retryDelay,
    processChange,
    saveSyncStatus,
    trackEvent,
  ]);

  // Process individual change
  const processChange = useCallback(async (change) => {
    switch (change.type) {
      case 'CREATE':
        await api.post(`/${change.entity}`, change.data);
        break;
      case 'UPDATE':
        await api.put(`/${change.entity}/${change.id}`, change.data);
        break;
      case 'DELETE':
        await api.delete(`/${change.entity}/${change.id}`);
        break;
      case 'BATCH':
        await api.post(`/${change.entity}/batch`, change.data);
        break;
      default:
        throw new Error(`Unknown change type: ${change.type}`);
    }
  }, []);

  // Sync data from server
  const syncFromServer = useCallback(async () => {
    if (!network.isConnected) return;

    try {
      setIsSyncing(true);

      // Sync each entity type
      const entities = ['matches', 'players', 'transactions'];
      for (const entity of entities) {
        const lastSync = await storage.getItem(`@Sync:${entity}`);
        const response = await api.get(`/${entity}/sync`, {
          params: { since: lastSync },
        });

        if (response.data) {
          // Update cache
          await cache.setItem(entity, response.data);
          // Update last sync time
          await storage.setItem(`@Sync:${entity}`, Date.now());
        }
      }

      setLastSyncTime(Date.now());
      await saveSyncStatus();

      trackEvent('sync_from_server_complete');
    } catch (error) {
      handleError(error);
      trackEvent('sync_from_server_failed', {
        error: error.message,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [
    network.isConnected,
    storage,
    cache,
    saveSyncStatus,
    trackEvent,
    handleError,
  ]);

  // Full sync
  const sync = useCallback(async () => {
    await Promise.all([
      processSyncQueue(),
      syncFromServer(),
    ]);
  }, [processSyncQueue, syncFromServer]);

  // Clear sync status
  const clearSync = useCallback(async () => {
    try {
      await storage.removeItem(syncStorageKey);
      await storage.removeItem(queueStorageKey);
      setPendingChanges([]);
      setLastSyncTime(null);

      trackEvent('sync_cleared');
    } catch (error) {
      handleError(error);
    }
  }, [storage, syncStorageKey, queueStorageKey, trackEvent, handleError]);

  // Set up periodic sync
  useEffect(() => {
    initializeSyncStatus();

    const interval = setInterval(() => {
      if (network.isConnected && !syncInProgress.current) {
        sync();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [network.isConnected, syncInterval, initializeSyncStatus, sync]);

  return {
    // Status
    isSyncing,
    lastSyncTime,
    pendingChanges,

    // Actions
    queueChange,
    sync,
    clearSync,
  };
};

// Example usage with match data
export const useMatchSync = () => {
  const sync = useSync();

  const createMatch = useCallback(async (matchData) => {
    return sync.queueChange({
      type: 'CREATE',
      entity: 'matches',
      data: matchData,
    });
  }, [sync]);

  const updateMatch = useCallback(async (matchId, matchData) => {
    return sync.queueChange({
      type: 'UPDATE',
      entity: 'matches',
      id: matchId,
      data: matchData,
    });
  }, [sync]);

  const deleteMatch = useCallback(async (matchId) => {
    return sync.queueChange({
      type: 'DELETE',
      entity: 'matches',
      id: matchId,
    });
  }, [sync]);

  return {
    ...sync,
    createMatch,
    updateMatch,
    deleteMatch,
  };
};

// Example usage with player data
export const usePlayerSync = () => {
  const sync = useSync();

  const updatePlayerStats = useCallback(async (playerId, stats) => {
    return sync.queueChange({
      type: 'UPDATE',
      entity: 'players',
      id: playerId,
      data: { stats },
    });
  }, [sync]);

  const batchUpdatePlayers = useCallback(async (updates) => {
    return sync.queueChange({
      type: 'BATCH',
      entity: 'players',
      data: updates,
    });
  }, [sync]);

  return {
    ...sync,
    updatePlayerStats,
    batchUpdatePlayers,
  };
};

export default useSync;
