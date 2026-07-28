const mongoose = require('mongoose');
const Contact = require('../models/Contact');

/**
 * @desc    Create a new contact
 * @route   POST /api/contacts/create
 * @access  Private
 */
const createContact = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      companyPosition,
      homeAddress,
      workAddress,
      paymentMethods = [],
      preferences,
      comment,
    } = req.body;

    // Basic validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.number?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email and phone number are required.',
      });
    }

    // Check duplicate email
    const existing = await Contact.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A contact with this email already exists.',
      });
    }

    // Validate company ID
    const validCompany = company && mongoose.isValidObjectId(company) ? company : null;

    // Sanitize payment methods
    const safePaymentMethods = paymentMethods.map((pm) => ({
      gateway: pm.gateway,
      gatewayCustomerId: pm.gatewayCustomerId,
      gatewayPaymentMethodId: pm.gatewayPaymentMethodId,
      brand: pm.brand,
      last4: pm.last4,
      expMonth: pm.expMonth,
      expYear: pm.expYear,
      billing: {
        fullName: pm.billing?.fullName,
        country: pm.billing?.country,
        address: pm.billing?.address,
        cardholderEmail: pm.billing?.cardholderEmail,
        additionalNotes: pm.billing?.additionalNotes,
      },
      isDefault: Boolean(pm.isDefault),
    }));

    // Create contact
    const contact = await Contact.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: {
        countryCode: phone.countryCode,
        number: phone.number,
      },
      company: validCompany,
      companyPosition: companyPosition?.trim() || '',
      homeAddress: homeAddress?.trim() || '',
      workAddress: workAddress?.trim() || '',
      paymentMethods: safePaymentMethods,
      preferences: preferences?.trim() || '',
      internalComments: comment?.trim()
        ? [{ text: comment.trim(), createdBy: req.user?._id }]
        : [],
      createdBy: req.user?._id,
    });

    // Populate referenced fields
    const populated = await contact.populate([
      { path: 'company', select: 'name' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Contact created successfully.',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A contact with this email already exists.',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      });
    }

    console.error('createContact error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create contact.',
    });
  }
};

/**
 * @desc    Get all contacts (with search & pagination)
 * @route   GET /api/contacts/list
 * @access  Private
 */
const getContacts = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;

    const query = {};
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { 'phone.number': regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .select('firstName lastName email phone company createdAt')
        .populate('company', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('getContacts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts.',
    });
  }
};

/**
 * @desc    Get single contact by ID
 * @route   GET /api/contacts/:id
 * @access  Private
 */
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID.',
      });
    }

    const contact = await Contact.findById(id)
      .populate('company', 'name')
      .lean();

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('getContactById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contact.',
    });
  }
};

/**
 * @desc    Update a contact
 * @route   PUT /api/contacts/update/:id
 * @access  Private
 */
const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      companyPosition,
      homeAddress,
      workAddress,
      paymentMethods,
      preferences,
      comment,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID.',
      });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found.',
      });
    }

    // Check duplicate email if changed
    if (email?.trim() && email.toLowerCase().trim() !== contact.email) {
      const existing = await Contact.findOne({
        _id: { $ne: id },
        email: email.toLowerCase().trim(),
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A contact with this email already exists.',
        });
      }
      contact.email = email.toLowerCase().trim();
    }

    // Update fields
    if (firstName?.trim()) contact.firstName = firstName.trim();
    if (lastName?.trim()) contact.lastName = lastName.trim();
    if (phone?.number) {
      contact.phone = {
        countryCode: phone.countryCode || contact.phone.countryCode,
        number: phone.number,
      };
    }
    if (company !== undefined) {
      contact.company = company && mongoose.isValidObjectId(company) ? company : null;
    }
    if (companyPosition !== undefined) contact.companyPosition = companyPosition?.trim() || '';
    if (homeAddress !== undefined) contact.homeAddress = homeAddress?.trim() || '';
    if (workAddress !== undefined) contact.workAddress = workAddress?.trim() || '';
    if (paymentMethods !== undefined) {
      // Sanitize payment methods
      contact.paymentMethods = paymentMethods.map((pm) => ({
        gateway: pm.gateway,
        gatewayCustomerId: pm.gatewayCustomerId,
        gatewayPaymentMethodId: pm.gatewayPaymentMethodId,
        brand: pm.brand,
        last4: pm.last4,
        expMonth: pm.expMonth,
        expYear: pm.expYear,
        billing: {
          fullName: pm.billing?.fullName,
          country: pm.billing?.country,
          address: pm.billing?.address,
          cardholderEmail: pm.billing?.cardholderEmail,
          additionalNotes: pm.billing?.additionalNotes,
        },
        isDefault: Boolean(pm.isDefault),
      }));
    }
    if (preferences !== undefined) contact.preferences = preferences?.trim() || '';
    if (comment?.trim()) {
      contact.internalComments.push({
        text: comment.trim(),
        createdBy: req.user?._id,
      });
    }

    await contact.save();

    const populated = await contact.populate([
      { path: 'company', select: 'name' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Contact updated successfully.',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A contact with this email already exists.',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      });
    }

    console.error('updateContact error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update contact.',
    });
  }
};

/**
 * @desc    Delete a contact (permanent)
 * @route   DELETE /api/contacts/delete/:id
 * @access  Private
 */
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID.',
      });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found.',
      });
    }

    await Contact.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Contact deleted successfully.',
      data: { id: contact._id },
    });
  } catch (error) {
    console.error('deleteContact error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete contact.',
    });
  }
};

/**
 * @desc    Get contacts for dropdown
 * @route   GET /api/contacts/dropdown
 * @access  Private
 */
const getContactDropdown = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .select('firstName lastName email _id')
      .sort({ firstName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error('getContactDropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts for dropdown.',
    });
  }
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactDropdown,
};