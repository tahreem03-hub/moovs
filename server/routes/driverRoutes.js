// routes/driverRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  getDriverDropdown
} = require('../controller/driverController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/multer');

//router.use(protect);

router.post('/create', upload.single('profilePicture'), createDriver);
router.get('/list', getDrivers);
router.get('/dropdown', getDriverDropdown);
router.get('/:id', getDriverById);
router.put('/update/:id', upload.single('profilePicture'), updateDriver);
router.delete('/delete/:id', deleteDriver);

module.exports = router;