import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { WS_URL } from '@env';
import useAuth from './useAuth';

const useWebSocket = (options = {}) => {
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true,
  } = options;

  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setIsConnecting(true);
      const token = await getToken();
      if (!token) throw new Error('No authentication token found');

      wsRef.current = new WebSocket(`${WS_URL}?token=${token}`);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectCountRef.current = 0;
        if (onOpen) onOpen();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          switch (data.type) {
            case 'MATCH_UPDATE':
              dispatch({ type: 'matches/updateMatch', payload: data.payload });
              break;
            case 'PLAYER_PRICE_UPDATE':
              dispatch({ type: 'players/updatePlayerPrice', payload: data.payload });
              break;
            case 'TRANSACTION_UPDATE':
              dispatch({ type: 'wallet/updateTransaction', payload: data.payload });
              break;
            default:
              if (onMessage) onMessage(data);
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        if (onClose) onClose(event);

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnecting(false);
    }
  }, [dispatch, getToken, onOpen, onMessage, onError, onClose, reconnectAttempts, reconnectInterval]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    reconnectCountRef.current = 0;
  }, []);

  // Send message through WebSocket
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Subscribe to specific events
  const subscribe = useCallback((events) => {
    if (Array.isArray(events)) {
      send({
        type: 'SUBSCRIBE',
        payload: events,
      });
    }
  }, [send]);

  // Unsubscribe from specific events
  const unsubscribe = useCallback((events) => {
    if (Array.isArray(events)) {
      send({
        type: 'UNSUBSCRIBE',
        payload: events,
      });
    }
  }, [send]);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
  };
};

// Example usage:
export const useMatchWebSocket = (matchId) => {
  const ws = useWebSocket({
    onOpen: () => {
      ws.subscribe([`match:${matchId}`]);
    },
  });

  useEffect(() => {
    return () => {
      if (ws.isConnected) {
        ws.unsubscribe([`match:${matchId}`]);
      }
    };
  }, [matchId, ws]);

  return ws;
};

export const usePlayerWebSocket = (playerId) => {
  const ws = useWebSocket({
    onOpen: () => {
      ws.subscribe([`player:${playerId}`]);
    },
  });

  useEffect(() => {
    return () => {
      if (ws.isConnected) {
        ws.unsubscribe([`player:${playerId}`]);
      }
    };
  }, [playerId, ws]);

  return ws;
};

export default useWebSocket;
