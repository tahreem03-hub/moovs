const express = require("express");
const {createVehicle, getAllVehicles} = require("../controller/vehicleController");
const { isAuthenticated } = require("../middleware/auth");
const upload = require("../middleware/multer");

const router = express.Router()

router.post('/create',upload.array("images", 6) ,createVehicle)
router.get('/my-vehicles', getAllVehicles);



module.exports = router;