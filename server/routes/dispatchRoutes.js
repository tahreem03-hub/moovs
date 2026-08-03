// routes/dispatchRoutes.js
const express = require('express');
const router = express.Router();
const { getDispatchBoard, updateStatus } = require('../controllers/dispatchController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.get('/board', getDispatchBoard);
router.patch('/:id/status', updateStatus);

module.exports = router;