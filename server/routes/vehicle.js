const express = require("express");
const {createVehicle} = require("../controller/vehicleController");
const { isAuthenticated } = require("../middleware/auth");
const upload = require("../middleware/multer");

const router = express.Router()

router.post('/create',upload.array("images", 6) ,createVehicle)



module.exports = router;