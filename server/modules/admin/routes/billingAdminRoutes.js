// modules/admin/routes/billingAdminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPendingRequests,
  approveRequest,
  rejectRequest
} = require('../../../controllers/settings/billingController');
const { isAuthenticated, authorizeAdmin } = require('../../../middleware/auth');

// All admin routes require authentication + admin role
router.use(isAuthenticated);
router.use(authorizeAdmin);

// Pending payment requests
router.get('/pending-requests', getPendingRequests);

// Approve/reject requests
router.patch('/approve/:requestId', approveRequest);
router.patch('/reject/:requestId', rejectRequest);

module.exports = router;