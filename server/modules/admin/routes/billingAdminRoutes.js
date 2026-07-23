// modules/admin/routes/billingAdminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPendingRequests,
  approveRequest,
  rejectRequest
} = require('../../../controller/settings/billingController');
const { isAuthenticated } = require('../../../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Admin role check
router.use(async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
});

// Pending payment requests
router.get('/pending-requests', getPendingRequests);

// Approve/reject requests
router.put('/approve/:requestId', approveRequest);
router.put('/reject/:requestId', rejectRequest);

module.exports = router;