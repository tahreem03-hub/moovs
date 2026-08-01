// driver-app/src/hooks/useWebSocket.js
import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export const useWebSocket = (driverId, userId, onNotification) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = useCallback(() => {
    if (!driverId) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}?driverId=${driverId}&userId=${userId}&role=driver`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      toast.success('Connected to real-time updates');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        
        // Handle different message types
        if (data.type === 'notification') {
          // Show toast notification
          toast[data.priority === 'urgent' ? 'error' : 'success'](data.message, {
            duration: data.priority === 'urgent' ? 10000 : 5000,
            icon: getNotificationIcon(data.type)
          });
          
          // Call callback if provided
          if (onNotification) {
            onNotification(data);
          }
        } else if (data.type === 'connected') {
          console.log('WebSocket connected:', data.message);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(() => {
          console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          connectWebSocket();
        }, 3000 * reconnectAttempts.current);
      } else {
        toast.error('Connection lost. Please refresh the page.');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [driverId, userId, onNotification]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  // Send message through socket
  const sendMessage = useCallback((type, data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    sendMessage,
    lastMessage
  };
};

// Helper to get notification icon
const getNotificationIcon = (type) => {
  const icons = {
    'new_trip': '🚗',
    'trip_update': '📝',
    'trip_cancelled': '❌',
    'message': '💬',
    'payment_received': '💰',
    'document_expiring': '⚠️',
    'document_approved': '✅',
    'document_rejected': '❌',
    'rating_received': '⭐',
    'system_alert': '🔔'
  };
  return icons[type] || '🔔';
};