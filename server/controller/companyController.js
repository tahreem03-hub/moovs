const mongoose = require('mongoose');
const Company = require('../models/Company');

// Helper function to generate unique filename
const generateFilename = (originalname) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = originalname.split('.').pop();
  return `company-${timestamp}-${random}.${ext}`;
};

// Helper function to get file URL (since we're using memory storage)
const getFileUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/companies/${filename}`;
};

/**
 * @desc    Create a new company
 * @route   POST /api/companies
 * @access  Private
 */
const createCompany = async (req, res) => {
  try {
    const { name, phone, email, address, website, description } = req.body;

    // Check duplicate
    const existing = await Company.findOne({
      name: name?.trim(),
    });
    
    if (existing) {
      // Delete uploaded file if it exists
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, () => {});
      }
      return res.status(409).json({
        success: false,
        message: 'Company with this name already exists.',
      });
    }

    const companyData = {
      name: name?.trim(),
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      address: address?.trim() || '',
      website: website?.trim() || '',
      description: description?.trim() || '',
      createdBy: req.user?._id || null,
    };

    // Save photo if uploaded
    if (req.file) {
      companyData.photo = {
        url: `/uploads/companies/${req.file.filename}`,
        filename: req.file.filename,
      };
    }

    const company = await Company.create(companyData);

    return res.status(201).json({
      success: true,
      message: 'Company created successfully.',
      data: company,
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, () => {});
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    
    console.error('Create company error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create company.',
    });
  }
};

/**
 * @desc    List / search companies
 * @route   GET /api/companies?search=&page=&limit=
 * @access  Private
 */
const getCompanies = async (req, res) => {
  try {

    const [companies, total] = await Promise.all([
      Company.find()
        .select('name email phone address website photo createdAt')
        .sort({ createdAt: -1 }),
      Company.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('getCompanies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch companies.',
    });
  }
};

/**
 * @desc    Get a single company
 * @route   GET /api/companies/:id
 * @access  Private
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format.',
      });
    }

    const company = await Company.findOne({
      _id: id,
    }).lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('getCompanyById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch company.',
    });
  }
};

/**
 * @desc    Update a company
 * @route   PUT /api/companies/:id
 * @access  Private
 */
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, website, description, removePhoto } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format.',
      });
    }

    // Find the company
    const company = await Company.findOne({
      _id: id,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Check for duplicate name when changing name
    if (name && name.trim()) {
      const trimmedName = name.trim();
      if (trimmedName.toLowerCase() !== company.name.toLowerCase()) {
        const existing = await Company.findOne({
          _id: { $ne: company._id },
          name: trimmedName,
  
        });

        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'A company with this name already exists.',
          });
        }
        company.name = trimmedName;
      }
    }

    // Update fields
    if (phone !== undefined) company.phone = phone?.trim() || '';
    if (email !== undefined) company.email = email?.trim() || '';
    if (address !== undefined) company.address = address?.trim() || '';
    if (website !== undefined) company.website = website?.trim() || '';
    if (description !== undefined) company.description = description?.trim() || '';

    // Handle photo update with memory storage
    if (req.file) {
      // Generate new filename for the new photo
      const filename = generateFilename(req.file.originalname);
      company.photo = {
        url: getFileUrl(filename),
        filename: filename,
      };
    } else if (removePhoto === 'true' || removePhoto === true) {
      // Remove existing photo
      company.photo = { url: null, filename: null };
    }

    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully.',
      data: company,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A company with this name already exists.',
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      });
    }

    console.error('updateCompany error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update company. Please try again.',
    });
  }
};

/**
 * @desc    Soft-delete a company
 * @route   DELETE /api/companies/:id
 * @access  Private
 */
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format.',
      });
    }

    // First find the company to get the photo filename
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Delete the photo file from disk if it exists
    if (company.photo?.filename) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../uploads/companies', company.photo.filename);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting photo file:', err);
        }
      });
    }

    // Permanently delete the company from database
    await Company.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Company permanently deleted successfully.',
      data: { id: company._id },
    });
  } catch (error) {
    console.error('deleteCompany error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete company.',
    });
  }
};
module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};