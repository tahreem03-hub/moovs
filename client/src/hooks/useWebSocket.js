import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const emojiFor = (type) =>
  ({
    new_trip: '🚗',
    trip_update: '📝',
    trip_cancelled: '❌',
    message: '💬',
    payment_received: '💰',
    document_expiring: '⚠️',
    document_approved: '✅',
    document_rejected: '❌',
    rating_received: '⭐',
    system_alert: '🔔',
  }[type] || '🔔');

export const useWebSocket = (operatorId, userId, onNotification) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  const onNotificationRef = useRef(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!operatorId) return;

    const url = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
    const socket = io(url, {
      query: { operatorId, userId, role: 'operator' },
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err.message);
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('Operator realtime ready:', data?.message);
    });

    socket.on('notification', (payload) => {
      const notification = { ...payload, _id: payload._id || payload.id };
      setLastMessage(notification);

      toast[notification.priority === 'urgent' || notification.priority === 'high' ? 'error' : 'success'](
        notification.message,
        {
          duration: notification.priority === 'urgent' || notification.priority === 'high' ? 10000 : 5000,
          icon: emojiFor(notification.type),
        }
      );

      onNotificationRef.current?.(notification);
    });

    return () => {
      socket.off('notification');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [operatorId, userId]);

  const sendMessage = useCallback((event, data) => {
    if (socketRef.current?.connected) socketRef.current.emit(event, data);
  }, []);

  return { socket: socketRef.current, isConnected, sendMessage, lastMessage };
};