const mongoose = require('mongoose');
const Company = require('../models/Company');
const fs = require('fs');
const path = require('path');

// Helper function to generate unique filename
const generateFilename = (originalname) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = originalname.split('.').pop();
  return `company-${timestamp}-${random}.${ext}`;
};

// Helper function to get file URL
const getFileUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/companies/${filename}`;
};

// Helper to delete file
const deletePhotoFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, '../uploads/companies', filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error deleting photo file:', err);
    }
  });
};

/**
 * @desc    Create a new company
 * @route   POST /api/company/create
 * @access  Private
 */
const createCompany = async (req, res) => {
  try {
    const { name, phone, email, address, website, description } = req.body;

    // ✅ Check duplicate for this operator only
    const existing = await Company.findOne({
      name: name?.trim(),
      createdBy: req.user._id  // ✅ Only check this operator's companies
    });
    
    if (existing) {
      if (req.file) deletePhotoFile(req.file.filename);
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
      createdBy: req.user._id,  // ✅ Always set to logged-in user
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
    if (req.file) deletePhotoFile(req.file.filename);
    
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
 * @desc    List / search companies (Operator only)
 * @route   GET /api/company/list
 * @access  Private
 */
const getCompanies = async (req, res) => {
  try {
    // ✅ Only get companies created by this operator
    const companies = await Company.find({ createdBy: req.user._id })
      .select('name email phone address website photo createdAt')
      .sort({ createdAt: -1 });

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
 * @desc    Get a single company (Operator only)
 * @route   GET /api/company/:id
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

    // ✅ Ensure operator owns this company
    const company = await Company.findOne({
      _id: id,
      createdBy: req.user._id
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
 * @desc    Update a company (Operator only)
 * @route   PUT /api/company/update/:id
 * @access  Private
 */
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, website, description, removePhoto } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      if (req.file) deletePhotoFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format.',
      });
    }

    // ✅ Ensure operator owns this company
    const company = await Company.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!company) {
      if (req.file) deletePhotoFile(req.file.filename);
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Check for duplicate name when changing name (within this operator's companies)
    if (name && name.trim()) {
      const trimmedName = name.trim();
      if (trimmedName.toLowerCase() !== company.name.toLowerCase()) {
        const existing = await Company.findOne({
          _id: { $ne: company._id },
          name: trimmedName,
          createdBy: req.user._id  // ✅ Only check this operator's companies
        });

        if (existing) {
          if (req.file) deletePhotoFile(req.file.filename);
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

    // Handle photo
    if (req.file) {
      if (company.photo?.filename) {
        deletePhotoFile(company.photo.filename);
      }
      company.photo = {
        url: `/uploads/companies/${req.file.filename}`,
        filename: req.file.filename,
      };
    } else if (removePhoto === 'true' || removePhoto === true) {
      if (company.photo?.filename) {
        deletePhotoFile(company.photo.filename);
      }
      company.photo = { url: null, filename: null };
    }

    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully.',
      data: company,
    });
  } catch (error) {
    if (req.file) deletePhotoFile(req.file.filename);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A company with this name already exists.',
      });
    }

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
 * @desc    Delete a company (Operator only)
 * @route   DELETE /api/company/delete/:id
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

    // ✅ Ensure operator owns this company
    const company = await Company.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Delete the photo file from disk if it exists
    if (company.photo?.filename) {
      deletePhotoFile(company.photo.filename);
    }

    // Permanently delete the company from database
    await Company.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully.',
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

/**
 * @desc    Get companies for dropdown (Operator only)
 * @route   GET /api/company/dropdown
 * @access  Private
 */
const getCompanyDropdown = async (req, res) => {
  try {
    const companies = await Company.find({ createdBy: req.user._id })
      .select('name _id')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('getCompanyDropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch companies for dropdown.',
    });
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyDropdown,
};