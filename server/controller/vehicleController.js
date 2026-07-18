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

// ✅ ADD THIS - Get single vehicle
const getVehicleById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    return next(new ErrorHandler("Vehicle not found", 404));
  }
  res.status(200).json({
    success: true,
    vehicle
  });
});

// ✅ ADD THIS - Update vehicle
const updateVehicle = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });
  if (!vehicle) {
    return next(new ErrorHandler("Vehicle not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Vehicle updated successfully",
    vehicle
  });
});

// ✅ ADD THIS - Delete vehicle
const deleteVehicle = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findByIdAndDelete(id);
  if (!vehicle) {
    return next(new ErrorHandler("Vehicle not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully"
  });
});

module.exports = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};