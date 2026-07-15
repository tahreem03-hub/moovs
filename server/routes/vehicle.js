const express = require("express");
const {createVehicle} = require("../controller/vehicleController");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router()

router.post('/create', createVehicle)

module.exports = router;