// routes/driverRoutes.js (Operator-facing - NOT the driver app)
const express = require('express');
const router = express.Router();
const {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  getDriverDropdown
} = require('../../controllers/settings/driverController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');
const upload = require('../../middleware/multer');



// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.post('/create', upload.single('profilePicture'), createDriver);
router.get('/list', getDrivers);
router.get('/dropdown', getDriverDropdown);
router.get('/:id', getDriverById);
router.put('/update/:id', upload.single('profilePicture'), updateDriver);
router.delete('/delete/:id', deleteDriver);

module.exports = router;