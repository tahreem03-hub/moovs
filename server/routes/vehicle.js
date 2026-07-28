const express = require("express");
const {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} = require("../controllers/vehicleController");
const { isAuthenticated, authorizeOperator } = require("../middleware/auth");
const upload = require("../middleware/multer");

const router = express.Router();

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.post('/create', upload.array("images", 6), createVehicle);
router.get('/my-vehicles', getAllVehicles);
router.get('/:id', getVehicleById);
router.put('/update/:id', updateVehicle);
router.delete('/delete/:id', deleteVehicle);

module.exports = router;