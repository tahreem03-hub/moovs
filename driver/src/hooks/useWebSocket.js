// driver-app/src/hooks/useWebSocket.js
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

/**
 * driverId here must be the USER _id (that's what the server rooms + notification
 * recipients key on — see notificationService: room `driver-<recipient>` where
 * recipient = driver.userId).
 */
export const useWebSocket = (driverId, userId, onNotification) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  // Keep the latest callback in a ref so a new inline function each render
  // does NOT tear down and recreate the socket.
  const onNotificationRef = useRef(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!driverId) return;

    // Socket.IO uses an http(s) URL and upgrades to WS itself — not ws://
    const url = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
    const socket = io(url, {
      query: { driverId, userId, role: 'driver' },
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

    // Server's confirmation event
    socket.on('connected', (data) => {
      console.log('Realtime ready:', data?.message);
    });

    socket.on('notification', (payload) => {
      // Server emits { id, ... }; the UI keys on _id, so normalize.
      const notification = { ...payload, _id: payload._id || payload.id };
      setLastMessage(notification);

      toast[notification.priority === 'urgent' ? 'error' : 'success'](notification.message, {
        duration: notification.priority === 'urgent' ? 10000 : 5000,
        icon: emojiFor(notification.type),
      });

      onNotificationRef.current?.(notification);
    });

    return () => {
      socket.off('notification');
      socket.disconnect();
      socketRef.current = null;
    };
    // NOTE: onNotification intentionally excluded — handled via ref above.
  }, [driverId, userId]);

  const sendMessage = useCallback((event, data) => {
    if (socketRef.current?.connected) socketRef.current.emit(event, data);
  }, []);

  return { socket: socketRef.current, isConnected, sendMessage, lastMessage };
};