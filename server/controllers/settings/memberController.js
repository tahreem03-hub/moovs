// controllers/memberController.js
const mongoose = require('mongoose');
const Member = require('../../models/settings/Member');

// Create Member
const createMember = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role,
      permissions
    } = req.body;

    // Check duplicate email
    const existing = await Member.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Member with this email already exists'
      });
    }

    const member = await Member.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      role: role || 'dispatcher',
      permissions: permissions || [],
      createdBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: member
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Create member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create member'
    });
  }
};

// Get All Members
const getMembers = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = { isActive: true };
    
    if (search.trim()) {
      query.$or = [
        { firstName: { $regex: search.trim(), $options: 'i' } },
        { lastName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const members = await Member.find(query)
      .select('firstName lastName email role lastLogin createdAt')
      .sort({ role: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Get members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch members'
    });
  }
};

// Get Member by ID
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }

    const member = await Member.findById(id).lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Get member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch member'
    });
  }
};

// Update Member
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      permissions,
      isActive
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }

    const member = await Member.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check duplicate email if changed
    if (email && email.toLowerCase().trim() !== member.email) {
      const existing = await Member.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Member with this email already exists'
        });
      }
    }

    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (email) member.email = email.toLowerCase().trim();
    if (role) member.role = role;
    if (permissions) member.permissions = permissions;
    if (isActive !== undefined) member.isActive = isActive;

    await member.save();

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: member
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Update member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update member'
    });
  }
};

// Delete Member
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }

    const member = await Member.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Prevent deleting last admin
    if (member.role === 'admin') {
      const adminCount = await Member.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin member'
        });
      }
    }

    await Member.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Delete member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete member'
    });
  }
};

// Get Member Dropdown
const getMemberDropdown = async (req, res) => {
  try {
    const members = await Member.find({ isActive: true })
      .select('firstName lastName email _id')
      .sort({ firstName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Get member dropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch members for dropdown'
    });
  }
};

module.exports = {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getMemberDropdown
};