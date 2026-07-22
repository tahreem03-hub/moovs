const Vehicle = require("../models/Vehicle");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/ErrorHandler");

// ============ CREATE VEHICLE ============
const createVehicle = catchAsyncError(async (req, res, next) => {
  const vehicle = await Vehicle.create({
    ...req.body,
    operatorId: req.user._id,   // ✅ Add operatorId
    createdBy: req.user._id     // ✅ Add createdBy
  });
  res.status(201).json({
    success: true,
    vehicle
  });
});

// ============ GET ALL VEHICLES (OPERATOR ONLY) ============
const getAllVehicles = catchAsyncError(async (req, res, next) => {
  const vehicles = await Vehicle.find({ operatorId: req.user._id })  // ✅ Filter by operator
    .sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: vehicles.length,
    vehicles
  });
});

// ============ GET SINGLE VEHICLE ============
const getVehicleById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findOne({ 
    _id: id,
    operatorId: req.user._id  // ✅ Security: ensure operator owns it
  });
  if (!vehicle) {
    return next(new ErrorHandler("Vehicle not found", 404));
  }
  res.status(200).json({
    success: true,
    vehicle
  });
});

// ============ UPDATE VEHICLE ============
const updateVehicle = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  
  // ✅ Ensure operator owns the vehicle
  const vehicle = await Vehicle.findOne({ 
    _id: id,
    operatorId: req.user._id
  });
  
  if (!vehicle) {
    return next(new ErrorHandler("Vehicle not found", 404));
  }

  // Update only if owner
  const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    message: "Vehicle updated successfully",
    vehicle: updatedVehicle
  });
});

// ============ DELETE VEHICLE ============
const deleteVehicle = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  
  // ✅ Ensure operator owns the vehicle
  const vehicle = await Vehicle.findOne({ 
    _id: id,
    operatorId: req.user._id
  });
  
  if (!vehicle) {
    return next(new ErrorHandler("Vehicle not found", 404));
  }

  await Vehicle.findByIdAndDelete(id);
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