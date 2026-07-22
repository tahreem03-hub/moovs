const express = require("express");
const {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} = require("../controller/vehicleController");
const { isAuthenticated } = require("../middleware/auth");
const upload = require("../middleware/multer");

const router = express.Router();

router.use(isAuthenticated);

router.post('/create', upload.array("images", 6), createVehicle);
router.get('/my-vehicles', getAllVehicles);
router.get('/:id', getVehicleById);
router.put('/update/:id', updateVehicle);
router.delete('/delete/:id', deleteVehicle);

module.exports = router;