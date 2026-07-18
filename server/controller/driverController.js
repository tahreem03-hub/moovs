// controllers/driverController.js
const mongoose = require('mongoose');
const Driver = require('../models/settings/Driver');
const fs = require('fs');
const path = require('path');

const deletePhotoFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, '../uploads/drivers', filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error deleting driver photo:', err);
    }
  });
};

const buildPhoto = (file) => {
  if (!file) return null;
  return {
    url: `/uploads/drivers/${file.filename}`,
    filename: file.filename
  };
};

// Create Driver
const createDriver = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      hireDate,
      licenseNumber,
      licenseExpiry,
      garageLocation,
      notes
    } = req.body;

    // Check duplicate email if provided
    if (email) {
      const existing = await Driver.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        if (req.file) deletePhotoFile(req.file.filename);
        return res.status(409).json({
          success: false,
          message: 'Driver with this email already exists'
        });
      }
    }

    const driver = await Driver.create({
      firstName,
      lastName,
      email: email?.toLowerCase().trim(),
      phone,
      profilePicture: buildPhoto(req.file),
      hireDate: hireDate || Date.now(),
      licenseNumber,
      licenseExpiry,
      garageLocation,
      notes,
      createdBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver
    });
  } catch (error) {
    if (req.file) deletePhotoFile(req.file.filename);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Create driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create driver'
    });
  }
};

// Get All Drivers
const getDrivers = async (req, res) => {
  try {
    const { search = '', isAvailable } = req.query;
    const query = { isActive: true };
    
    if (search.trim()) {
      query.$or = [
        { firstName: { $regex: search.trim(), $options: 'i' } },
        { lastName: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    const drivers = await Driver.find(query)
      .select('firstName lastName email phone profilePicture isAvailable createdAt')
      .sort({ isAvailable: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
};

// Get Driver by ID
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID'
      });
    }

    const driver = await Driver.findById(id).lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('Get driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch driver'
    });
  }
};

// Update Driver
const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      hireDate,
      licenseNumber,
      licenseExpiry,
      garageLocation,
      notes,
      isActive,
      isAvailable,
      removePhoto
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      if (req.file) deletePhotoFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID'
      });
    }

    const driver = await Driver.findById(id);

    if (!driver) {
      if (req.file) deletePhotoFile(req.file.filename);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check duplicate email if changed
    if (email && email.toLowerCase().trim() !== driver.email) {
      const existing = await Driver.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id }
      });
      if (existing) {
        if (req.file) deletePhotoFile(req.file.filename);
        return res.status(409).json({
          success: false,
          message: 'Driver with this email already exists'
        });
      }
    }

    if (firstName) driver.firstName = firstName;
    if (lastName) driver.lastName = lastName;
    if (email !== undefined) driver.email = email?.toLowerCase().trim();
    if (phone) driver.phone = phone;
    if (hireDate) driver.hireDate = hireDate;
    if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber;
    if (licenseExpiry) driver.licenseExpiry = licenseExpiry;
    if (garageLocation !== undefined) driver.garageLocation = garageLocation;
    if (notes !== undefined) driver.notes = notes;
    if (isActive !== undefined) driver.isActive = isActive;
    if (isAvailable !== undefined) driver.isAvailable = isAvailable;

    // Handle photo
    if (req.file) {
      if (driver.profilePicture?.filename) {
        deletePhotoFile(driver.profilePicture.filename);
      }
      driver.profilePicture = buildPhoto(req.file);
    } else if (removePhoto === 'true' || removePhoto === true) {
      if (driver.profilePicture?.filename) {
        deletePhotoFile(driver.profilePicture.filename);
      }
      driver.profilePicture = null;
    }

    await driver.save();

    return res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    });
  } catch (error) {
    if (req.file) deletePhotoFile(req.file.filename);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Update driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update driver'
    });
  }
};

// Delete Driver
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID'
      });
    }

    const driver = await Driver.findById(id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Delete profile picture
    if (driver.profilePicture?.filename) {
      deletePhotoFile(driver.profilePicture.filename);
    }

    await Driver.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete driver'
    });
  }
};

// Get Driver Dropdown
const getDriverDropdown = async (req, res) => {
  try {
    const drivers = await Driver.find({ isActive: true, isAvailable: true })
      .select('firstName lastName _id')
      .sort({ firstName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Get driver dropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers for dropdown'
    });
  }
};

module.exports = {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  getDriverDropdown
};