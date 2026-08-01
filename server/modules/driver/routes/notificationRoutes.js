// modules/driver/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeDriver } = require('../../../middleware/auth');
const NotificationService = require('../services/notificationService');

// Get IO instance from app
const getNotificationService = (req) => {
  const io = req.app.get('io');
  return new NotificationService(io);
};

// Get all notifications
router.get('/notifications', isAuthenticated, authorizeDriver, async (req, res) => {
  try {
    const notificationService = getNotificationService(req);
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;
    
    const result = await notificationService.getNotifications(
      req.user._id,
      'User',
      { page, limit, unreadOnly, type }
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count
router.get('/notifications/unread-count', isAuthenticated, authorizeDriver, async (req, res) => {
  try {
    const notificationService = getNotificationService(req);
    const count = await notificationService.getUnreadCount(req.user._id, 'User');
    
    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', isAuthenticated, authorizeDriver, async (req, res) => {
  try {
    const notificationService = getNotificationService(req);
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all as read
router.put('/notifications/read-all', isAuthenticated, authorizeDriver, async (req, res) => {
  try {
    const notificationService = getNotificationService(req);
    const result = await notificationService.markAllAsRead(req.user._id, 'User');
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: result
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete notification
router.delete('/notifications/:id', isAuthenticated, authorizeDriver, async (req, res) => {
  try {
    const notificationService = getNotificationService(req);
    await notificationService.deleteNotification(req.params.id, req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;