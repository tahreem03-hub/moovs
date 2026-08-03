// operator-app/src/hooks/useWebSocket.js
import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const getNotificationLabel = (type) =>
  ({
    new_trip: 'New Trip Assignment',
    trip_update: 'Trip Update',
    trip_cancelled: 'Trip Cancelled',
    message: 'New Message',
    payment_received: 'Payment Received',
    document_expiring: 'Document Expiring',
    document_approved: 'Document Approved',
    document_rejected: 'Document Rejected',
    rating_received: 'New Rating',
    system_alert: 'System Alert',
    dispatch_update: 'Dispatch Update',
    driver_status: 'Driver Status',
  }[type] || 'Notification');

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

      const label = getNotificationLabel(notification.type);
      const isUrgent = notification.priority === 'urgent' || notification.priority === 'high';
      
      // Professional toast with clean design - using object style instead of JSX
      toast(
        `${label}: ${notification.message}`,
        {
          duration: isUrgent ? 8000 : 5000,
          position: 'top-right',
          style: {
            background: '#FFFFFF',
            color: '#111827',
            padding: '14px 18px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            borderLeft: `4px solid ${isUrgent ? '#EF4444' : '#10B981'}`,
            fontWeight: '500',
            fontSize: '14px',
            maxWidth: '420px',
          },
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