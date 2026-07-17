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

module.exports = {
  createVehicle,
}