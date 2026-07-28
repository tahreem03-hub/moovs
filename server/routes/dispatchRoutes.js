// routes/dispatchRoutes.js
const express = require('express');
const router = express.Router();
const { getDispatchBoard, assignDriver, updateStatus } = require('../controllers/dispatchController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.get('/board', getDispatchBoard);
router.post('/:id/assign-driver', assignDriver);
router.put('/:id/status', updateStatus);

module.exports = router;