// controllers/crmController.js
const Contact = require('../models/Contact');
const Reservation = require('../models/Reservation');
const Quote = require('../models/Quote');

// Get customer insights
const getCustomerInsights = async (req, res) => {
  try {
    const contacts = await Contact.find({ operatorId: req.user._id, isDeleted: false })
      .select('firstName lastName email phone company createdAt')
      .limit(20)
      .sort({ createdAt: -1 });

    const totalContacts = await Contact.countDocuments({ operatorId: req.user._id, isDeleted: false });

    // Get activity stats
    const reservations = await Reservation.find({ operatorId: req.user._id, isDeleted: false })
      .select('bookingContact status createdAt');

    const quotes = await Quote.find({ operatorId: req.user._id, isDeleted: false })
      .select('bookingContact status createdAt');

    // Group by customer
    const customerMap = new Map();
    reservations.forEach(r => {
      if (r.bookingContact) {
        const id = r.bookingContact.toString();
        if (!customerMap.has(id)) customerMap.set(id, { reservations: 0, quotes: 0 });
        customerMap.get(id).reservations++;
      }
    });
    quotes.forEach(q => {
      if (q.bookingContact) {
        const id = q.bookingContact.toString();
        if (!customerMap.has(id)) customerMap.set(id, { reservations: 0, quotes: 0 });
        customerMap.get(id).quotes++;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalContacts,
        recentContacts: contacts,
        activity: Array.from(customerMap.entries()).slice(0, 10)
      }
    });
  } catch (error) {
    console.error('CRM error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load CRM data' });
  }
};

// Get customer details
const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findOne({ _id: id, operatorId: req.user._id }).lean();
    if (!contact) return res.status(404).json({ success: false, message: 'Customer not found' });

    const reservations = await Reservation.find({
      operatorId: req.user._id,
      $or: [{ bookingContact: id }, { passenger: id }],
      isDeleted: false
    })
      .populate('vehicle', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    const quotes = await Quote.find({
      operatorId: req.user._id,
      bookingContact: id,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: { contact, reservations, quotes }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer details' });
  }
};

// Add customer note
const addCustomerNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Note is required' });

    const contact = await Contact.findOne({ _id: id, operatorId: req.user._id });
    if (!contact) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Add to contact's notes (assuming you have a notes field, or you can create a separate Notes model)
    contact.notes = contact.notes || [];
    contact.notes.push({ text: text.trim(), createdBy: req.user._id, createdAt: new Date() });
    await contact.save();

    return res.status(200).json({ success: true, message: 'Note added', data: contact.notes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add note' });
  }
};

module.exports = { getCustomerInsights, getCustomerDetails, addCustomerNote };