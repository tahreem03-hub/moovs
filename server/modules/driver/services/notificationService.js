// services/notificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Create and send notification
  async createNotification({
    recipient,
    recipientType,
    recipientRole,
    type,
    title,
    message,
    data = {},
    priority = 'medium',
    actionUrl = null
  }) {
    try {
      // Create notification in database
      const notification = new Notification({
        recipient,
        recipientType,
        recipientRole,
        type,
        title,
        message,
        data,
        priority,
        actionUrl,
        read: false,
        createdAt: new Date()
      });

      await notification.save();

      // Send real-time notification via WebSocket
      const roomName = `${recipientRole}-${recipient}`;
      if (this.io) {
        this.io.to(roomName).emit('notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          createdAt: notification.createdAt,
          read: notification.read
        });
      }

      return notification;
    } catch (error) {
      console.error('Notification creation error:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getNotifications(recipient, recipientType, options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = options;

    const query = {
      recipient: recipient,
      recipientType: recipientType,
      isDeleted: false
    };

    if (unreadOnly) {
      query.read = false;
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, recipient) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: recipient
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  // Mark all as read
  async markAllAsRead(recipient, recipientType) {
    const result = await Notification.updateMany(
      {
        recipient: recipient,
        recipientType: recipientType,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    return result;
  }

  // Get unread count
  async getUnreadCount(recipient, recipientType) {
    const count = await Notification.countDocuments({
      recipient: recipient,
      recipientType: recipientType,
      read: false,
      isDeleted: false
    });

    return count;
  }

  // Delete notification
  async deleteNotification(notificationId, recipient) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: recipient
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isDeleted = true;
    await notification.save();

    return notification;
  }
}

module.exports = NotificationService;