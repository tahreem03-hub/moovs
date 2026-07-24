// routes/payableRoutes.js
const express = require('express');
const router = express.Router();
const { createPayable, getPayables, updatePayableStatus, deletePayable } = require('../controller/payabaleController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.post('/create', createPayable);
router.get('/list', getPayables);
router.put('/:id/status', updatePayableStatus);
router.delete('/:id', deletePayable);

module.exports = router;