const mongoose = require('mongoose');
const Driver = require('../../models/settings/Driver');
const User = require('../../models/User');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
// Add email service
const { sendDriverCredentials } = require('../../utils/sendEmail');

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
// controllers/settings/driverController.js

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

        const currentUser = req.user;
        
        if (!['user', 'admin'].includes(currentUser.role)) {
            if (req.file) deletePhotoFile(req.file.filename);
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const operatorId = currentUser.role === 'admin' 
            ? req.body.operatorId || currentUser._id 
            : currentUser._id;

        // Check duplicate phone within operator
        if (phone) {
            const existing = await Driver.findOne({
                phone: phone.trim(),
                operator: operatorId
            });
            if (existing) {
                if (req.file) deletePhotoFile(req.file.filename);
                return res.status(409).json({
                    success: false,
                    message: 'Driver with this phone already exists'
                });
            }
        }

        // Check duplicate email within operator
        if (email) {
            const existing = await Driver.findOne({
                email: email.toLowerCase().trim(),
                operator: operatorId
            });
            if (existing) {
                if (req.file) deletePhotoFile(req.file.filename);
                return res.status(409).json({
                    success: false,
                    message: 'Driver with this email already exists in your fleet'
                });
            }
        }

        // CHECK IF USER ALREADY EXISTS IN USERS COLLECTION
        let user = null;
        let userId = null;
        let tempPassword = null;

        if (email) {
            user = await User.findOne({ email: email.toLowerCase().trim() });
            
            if (user) {
                // User exists - check if already linked to a driver
                const existingDriver = await Driver.findOne({ userId: user._id });
                if (existingDriver) {
                    if (req.file) deletePhotoFile(req.file.filename);
                    return res.status(409).json({
                        success: false,
                        message: 'This email is already linked to another driver'
                    });
                }
                
                // Use existing user
                userId = user._id;
                console.log('Using existing user:', user.email);
            } else {
                // Create new user
                tempPassword = Math.random().toString(36).slice(-8);
                
                user = await User.create({
                    Fname: firstName,
                    Lname: lastName,
                    email: email.toLowerCase().trim(),
                    CompanyName: currentUser.CompanyName || 'MOOVS Driver',
                    password: tempPassword,
                    phone: phone.trim(),
                    role: 'driver',
                    createdBy: currentUser._id,
                    isActive: true
                });
                
                userId = user._id;
                console.log('Created new user:', user.email);
            }
        }

        // Create driver profile
        const driver = await Driver.create({
            firstName,
            lastName,
            email: email?.toLowerCase().trim(),
            phone: phone.trim(),
            profilePicture: buildPhoto(req.file),
            hireDate: hireDate || Date.now(),
            licenseNumber,
            licenseExpiry,
            garageLocation,
            notes,
            operator: operatorId,
            userId: userId, // Link to user (existing or new)
            createdBy: currentUser._id,
            isActive: true,
            isAvailable: true
        });

        // Send email ONLY if new user was created
        if (tempPassword && user) {
            try {
                await sendDriverCredentials({
                    email: user.email,
                    firstName: user.Fname,
                    tempPassword: tempPassword,
                    companyName: currentUser.CompanyName || 'MOOVS',
                    frontendUrl: req.headers.origin || process.env.FRONTEND_URL
                });
                console.log('Credentials email sent to:', user.email);
            } catch (emailError) {
                console.error('Failed to send email:', emailError.message);
                // Don't fail the driver creation if email fails
            }
        } else if (user && !tempPassword) {
            console.log('User already exists. No email sent.');
        }

        const populatedDriver = await Driver.findById(driver._id)
            .populate('userId', 'Fname Lname email role isActive')
            .populate('operator', 'Fname Lname email CompanyName');

        return res.status(201).json({
            success: true,
            message: tempPassword 
                ? 'Driver created successfully. Login credentials sent to email.'
                : 'Driver created successfully and linked to existing user.',
            data: populatedDriver
        });
    } catch (error) {
        if (req.file) deletePhotoFile(req.file.filename);
        
        // Handle duplicate key error specifically
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists. Please use a different email.'
            });
        }
        
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
// Get Driver by ID
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID'
      });
    }

    const query = { _id: id };
    if (currentUser.role === 'operator') {
      query.operator = currentUser._id;
    }

    const driver = await Driver.findOne(query)
      .populate('userId', 'Fname Lname email role isActive phone')
      .populate('operator', 'Fname Lname email CompanyName')
      .populate('createdBy', 'Fname Lname email')
      .lean();

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

    const currentUser = req.user;

    if (!mongoose.isValidObjectId(id)) {
      if (req.file) deletePhotoFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID'
      });
    }

    // Find driver with ownership check
    const query = { _id: id };
    if (currentUser.role === 'operator') {
      query.operator = currentUser._id;
    }

    const driver = await Driver.findOne(query);

    if (!driver) {
      if (req.file) deletePhotoFile(req.file.filename);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check duplicate phone if changed
    if (phone && phone.trim() !== driver.phone) {
      const existing = await Driver.findOne({
        phone: phone.trim(),
        operator: driver.operator,
        _id: { $ne: id }
      });
      if (existing) {
        if (req.file) deletePhotoFile(req.file.filename);
        return res.status(409).json({
          success: false,
          message: 'Driver with this phone already exists'
        });
      }
    }

    // Check duplicate email if changed
    if (email && email.toLowerCase().trim() !== driver.email) {
      const existing = await Driver.findOne({
        email: email.toLowerCase().trim(),
        operator: driver.operator,
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

    // Update fields
    if (firstName) driver.firstName = firstName;
    if (lastName) driver.lastName = lastName;
    if (email !== undefined) driver.email = email?.toLowerCase().trim();
    if (phone) driver.phone = phone.trim();
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

    // Update linked user account if exists
    if (driver.userId) {
      const userUpdate = {};
      if (firstName) userUpdate.Fname = firstName;
      if (lastName) userUpdate.Lname = lastName;
      if (email) userUpdate.email = email.toLowerCase().trim();
      if (phone) userUpdate.phone = phone.trim();
      if (isActive !== undefined) userUpdate.isActive = isActive;
      
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(driver.userId, userUpdate);
      }
    }

    const updatedDriver = await Driver.findById(id)
      .populate('userId', 'Fname Lname email role isActive')
      .populate('operator', 'Fname Lname email CompanyName');

    return res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: updatedDriver
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
    const currentUser = req.user;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID'
      });
    }

    // Find driver with ownership check
    const query = { _id: id };
    if (currentUser.role === 'operator') {
      query.operator = currentUser._id;
    }

    const driver = await Driver.findOne(query);

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

    // Optionally delete linked user account
    if (req.query.deleteUser === 'true' && driver.userId) {
      await User.findByIdAndDelete(driver.userId);
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
    const currentUser = req.user;
    
    const query = { 
      isActive: true,
      isAvailable: true
    };

    if (currentUser.role === 'operator') {
      query.operator = currentUser._id;
    } else if (currentUser.role === 'admin' && req.query.operatorId) {
      query.operator = req.query.operatorId;
    }

    const drivers = await Driver.find(query)
      .select('firstName lastName _id phone')
      .populate('userId', 'role')
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
      message: 'Failed to fetch drivers'
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