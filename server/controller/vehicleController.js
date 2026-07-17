const Vehicle = require("../models/Vehicle");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/ErrorHandler");

const createVehicle = catchAsyncError(async (req, res, next) => {
  const vehicle = await Vehicle.create(req.body);
  res.status(201).json({
    success: true,
    vehicle
  });
});

const getAllVehicles = catchAsyncError(async (req, res, next) => {

    const vehicles = await Vehicle.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: vehicles.length,
        vehicles
    });

});

module.exports = {
  createVehicle,
  getAllVehicles,
}