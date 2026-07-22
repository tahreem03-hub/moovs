// controllers/quoteController.js
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const Contact = require('../models/Contact');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const CompanyProfile = require('../models/settings/CompanyProfile');

// ============ CREATE QUOTE ============
const createQuote = async (req, res) => {
  try {
    const {
      bookingContact,
      orderType,
      assignedMember,
      tripType,
      passenger,
      pickupDateTime,
      dropoffDateTime,
      stops,
      passengerCount,
      driverNote,
      tripNotes,
      vehicle,
      pricing,
      internalComments,
      status
    } = req.body;

    // Validate required fields
    if (!vehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is required'
      });
    }
    if (!pickupDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date/time is required'
      });
    }
    if (!stops || stops.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least pickup and dropoff stops are required'
      });
    }

    // Validate stops have pickup and dropoff
    const hasPickup = stops.some(s => s.type === 'pickup');
    const hasDropoff = stops.some(s => s.type === 'dropoff');
    if (!hasPickup || !hasDropoff) {
      return res.status(400).json({
        success: false,
        message: 'Must have both pickup and dropoff stops'
      });
    }

    // Get pricing preferences from company profile
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    const pricingItems = profile?.preferences?.pricingLayout?.selectedItems || [];

    // If no pricing items provided, use defaults from preferences
    let pricingData = pricing;
    if (!pricingData || !pricingData.items || pricingData.items.length === 0) {
      pricingData = {
        items: pricingItems.map(item => ({
          label: item.name,
          rateType: item.type === 'percentage' ? 'flat' : 'flat',
          amount: item.amount || 0,
          hours: 0,
          isAutoCalculated: false,
          taxable: false
        })),
        taxRate: 0,
        discount: 0,
        gratuity: 0,
        currency: 'USD'
      };
    }

    const quote = await Quote.create({
      operatorId: req.user._id,
      bookingContact: bookingContact || null,
      orderType: orderType || 'retail',
      assignedMember: assignedMember || null,
      tripType: tripType || 'hourly',
      passenger: passenger || null,
      pickupDateTime,
      dropoffDateTime: dropoffDateTime || null,
      stops,
      passengerCount: passengerCount || null,
      driverNote: driverNote || '',
      tripNotes: tripNotes || '',
      vehicle,
      pricing: pricingData,
      internalComments: internalComments || [],
      status: status || 'draft',
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Quote created successfully',
      data: quote
    });
  } catch (error) {
    console.error('Create quote error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create quote'
    });
  }
};

// ============ GET ALL QUOTES ============
const getQuotes = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {
      operatorId: req.user._id,
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      // Search in quoteNumber and related fields
      const bookingContacts = await Contact.find({
        operatorId: req.user._id,
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex }
        ]
      }).select('_id');

      const contactIds = bookingContacts.map(c => c._id);
      query.$or = [
        { quoteNumber: regex },
        { bookingContact: { $in: contactIds } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [quotes, total] = await Promise.all([
      Quote.find(query)
        .populate('bookingContact', 'firstName lastName email phone company')
        .populate('assignedMember', 'Fname Lname email')
        .populate('vehicle', 'name type passengerCapacity images')
        .populate('passenger', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Quote.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: quotes,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quotes'
    });
  }
};

// ============ GET QUOTE BY ID ============
const getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID'
      });
    }

    const quote = await Quote.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    })
      .populate('bookingContact', 'firstName lastName email phone company')
      .populate('assignedMember', 'Fname Lname email')
      .populate('vehicle', 'name type passengerCapacity images')
      .populate('passenger', 'firstName lastName email');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Get quote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quote'
    });
  }
};

// ============ UPDATE QUOTE ============
const updateQuote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID'
      });
    }

    const quote = await Quote.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    const {
      bookingContact,
      orderType,
      assignedMember,
      tripType,
      passenger,
      pickupDateTime,
      dropoffDateTime,
      stops,
      passengerCount,
      driverNote,
      tripNotes,
      vehicle,
      pricing,
      internalComments,
      status
    } = req.body;

    if (bookingContact !== undefined) quote.bookingContact = bookingContact;
    if (orderType) quote.orderType = orderType;
    if (assignedMember !== undefined) quote.assignedMember = assignedMember;
    if (tripType) quote.tripType = tripType;
    if (passenger !== undefined) quote.passenger = passenger;
    if (pickupDateTime) quote.pickupDateTime = pickupDateTime;
    if (dropoffDateTime !== undefined) quote.dropoffDateTime = dropoffDateTime;
    if (stops) quote.stops = stops;
    if (passengerCount !== undefined) quote.passengerCount = passengerCount;
    if (driverNote !== undefined) quote.driverNote = driverNote;
    if (tripNotes !== undefined) quote.tripNotes = tripNotes;
    if (vehicle) quote.vehicle = vehicle;
    if (pricing) quote.pricing = pricing;
    if (internalComments) quote.internalComments = internalComments;
    if (status) quote.status = status;

    quote.updatedBy = req.user._id;
    await quote.save();

    return res.status(200).json({
      success: true,
      message: 'Quote updated successfully',
      data: quote
    });
  } catch (error) {
    console.error('Update quote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update quote'
    });
  }
};

// ============ UPDATE QUOTE STATUS ============
const updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const quote = await Quote.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    quote.status = status;
    quote.updatedBy = req.user._id;
    await quote.save();

    return res.status(200).json({
      success: true,
      message: `Quote ${status} successfully`,
      data: quote
    });
  } catch (error) {
    console.error('Update quote status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update quote status'
    });
  }
};

// ============ DELETE QUOTE (Soft Delete) ============
const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID'
      });
    }

    const quote = await Quote.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    quote.isDeleted = true;
    quote.updatedBy = req.user._id;
    await quote.save();

    return res.status(200).json({
      success: true,
      message: 'Quote deleted successfully'
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete quote'
    });
  }
};

// ============ GET QUOTE STATS ============
const getQuoteStats = async (req, res) => {
  try {
    const [total, byStatus, recent] = await Promise.all([
      Quote.countDocuments({
        operatorId: req.user._id,
        isDeleted: false
      }),
      Quote.aggregate([
        {
          $match: {
            operatorId: req.user._id,
            isDeleted: false
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Quote.find({
        operatorId: req.user._id,
        isDeleted: false
      })
        .populate('bookingContact', 'firstName lastName')
        .populate('vehicle', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    const statusCounts = {
      draft: 0,
      new: 0,
      sent: 0,
      archived: 0
    };

    byStatus.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        total,
        statusCounts,
        recent
      }
    });
  } catch (error) {
    console.error('Get quote stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quote stats'
    });
  }
};

// ============ ADD INTERNAL COMMENT ============
const addInternalComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID'
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const quote = await Quote.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Get user name for comment
    const user = await User.findById(req.user._id);
    const userName = user ? `${user.Fname} ${user.Lname}` : 'Unknown';

    quote.internalComments.push({
      text: text.trim(),
      createdBy: req.user._id,
      createdByName: userName
    });

    quote.updatedBy = req.user._id;
    await quote.save();

    return res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: quote.internalComments
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// ============ CALCULATE PRICING ============
const calculatePricing = async (req, res) => {
  try {
    const { stops, tripType, vehicleId, pricingItems } = req.body;

    // Get pricing preferences
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    const preferences = profile?.preferences || {};

    // Base calculation logic
    let baseRate = 0;
    let extraStops = 0;
    let waitTime = 0;
    let tolls = 0;
    let gratuity = 0;
    let tax = 0;
    let discount = 0;
    let customItemsTotal = 0;

    // Get vehicle base price if available
    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      // Use vehicle pricing if available
    }

    // Calculate based on trip type
    if (tripType === 'hourly') {
      // Hourly pricing logic
    } else if (tripType === 'one_way') {
      // One-way pricing logic
    } else if (tripType === 'round_trip') {
      // Round-trip pricing logic
    }

    // Apply custom items from preferences
    if (pricingItems && pricingItems.length > 0) {
      pricingItems.forEach(item => {
        if (item.type === 'percentage') {
          customItemsTotal += (baseRate * item.amount) / 100;
        } else {
          customItemsTotal += item.amount || 0;
        }
      });
    }

    const total = Math.max(0, baseRate + extraStops + waitTime + tolls + gratuity + tax - discount + customItemsTotal);

    return res.status(200).json({
      success: true,
      data: {
        baseRate,
        extraStops,
        waitTime,
        tolls,
        gratuity,
        tax,
        discount,
        customItemsTotal,
        total,
        currency: 'USD'
      }
    });
  } catch (error) {
    console.error('Calculate pricing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate pricing'
    });
  }
};

module.exports = {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats,
  addInternalComment,
  calculatePricing
};