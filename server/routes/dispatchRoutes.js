// routes/dispatchRoutes.js
const express = require('express');
const router = express.Router();
const { getDispatchBoard, assignDriver, updateStatus } = require('../controller/dispatchController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/board', getDispatchBoard);
router.post('/:id/assign-driver', assignDriver);
router.put('/:id/status', updateStatus);

module.exports = router;