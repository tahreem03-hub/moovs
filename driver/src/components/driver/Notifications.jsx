import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCircle, Clock, AlertCircle, X,
  Car, DollarSign, MessageCircle, Loader2,
  Star, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

const getNotificationIcon = (type) => {
  const icons = {
    'new_trip': Car,
    'trip_update': Clock,
    'trip_cancelled': X,
    'message': MessageCircle,
    'payment_received': DollarSign,
    'document_expiring': AlertCircle,
    'document_approved': CheckCircle,
    'document_rejected': X,
    'rating_received': Star,
    'system_alert': Bell
  };
  return icons[type] || Bell;
};

const getNotificationColor = (type) => {
  const colors = {
    'new_trip': 'text-blue-500',
    'trip_update': 'text-indigo-500',
    'trip_cancelled': 'text-red-500',
    'message': 'text-purple-500',
    'payment_received': 'text-green-500',
    'document_expiring': 'text-yellow-500',
    'document_approved': 'text-green-500',
    'document_rejected': 'text-red-500',
    'rating_received': 'text-yellow-500',
    'system_alert': 'text-gray-500'
  };
  return colors[type] || 'text-gray-500';
};

const Notifications = ({ driverId, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filter, setFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // WebSocket connection for real-time notifications
  const { isConnected } = useWebSocket(driverId, userId, (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [pagination.page, showUnreadOnly, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (showUnreadOnly) params.unreadOnly = true;   // only send when actually true
      if (filter !== 'all') params.type = filter;

      const response = await driverApi.getNotifications(params);
      const { notifications: data, pagination: pag } = response.data.data;

      setNotifications(data);
      setPagination(pag);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await driverApi.getUnreadCount();
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await driverApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n =>
          n._id === id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await driverApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await driverApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filterTypes = [
    { value: 'all', label: 'All' },
    { value: 'new_trip', label: 'Trips' },
    { value: 'payment_received', label: 'Payments' },
    { value: 'document_approved', label: 'Documents' },
    { value: 'message', label: 'Messages' },
    { value: 'system_alert', label: 'System' }
  ];

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
          {isConnected ? (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          ) : (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Offline
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-1">
          {filterTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => { setFilter(type.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-3 py-1 text-sm rounded-lg transition ${filter === type.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button
            onClick={() => { setShowUnreadOnly((v) => !v); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`px-3 py-1 text-sm rounded-lg transition ${showUnreadOnly
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
              }`}
          >
            {showUnreadOnly ? 'Showing Unread' : 'Show All'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);
            const isUnread = !notification.read;

            return (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition relative ${isUnread ? 'bg-blue-50' : ''
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                          {notification.priority === 'urgent' && (
                            <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                              Urgent
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatTime(notification.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {notification.actionUrl && (
                      <button
                        onClick={() => navigate((notification.actionUrl || '').replace(/^\/driver/, '') || '/')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                      >
                        View details →
                      </button>
                    )}
                    {notification.data && notification.data.tripId && (
                      <div className="mt-2 text-xs text-gray-500">
                        Trip: #{notification.data.tripId.slice(-6)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} notifications
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;