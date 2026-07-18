const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    photo: {
      url: { type: String, default: null },
      filename: { type: String, default: null },
    },

    name: {
      type: String,
      required: [true, 'Company name is required.'],
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters.'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Address cannot exceed 500 characters.'],
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better search performance
companySchema.index({ name: 1, isDeleted: 1 });

module.exports = mongoose.model('Company', companySchema);