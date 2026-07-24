// controllers/paymentController.js
const Reservation = require('../models/Reservation');
const crypto = require('crypto');

// ============ COLLECT PAYMENT ============
const collectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, reference, notes } = req.body;

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Calculate remaining balance
    const totalPaid = reservation.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = reservation.pricing.total - totalPaid;

    if (amount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds remaining balance of $${remaining.toFixed(2)}`
      });
    }

    // Add payment
    reservation.payments.push({
      amount,
      method,
      reference: reference || '',
      notes: notes || '',
      collectedBy: req.user._id,
      collectedAt: new Date(),
      status: 'completed'
    });

    // Update payment status
    const newTotalPaid = totalPaid + amount;
    if (newTotalPaid >= reservation.pricing.total) {
      reservation.paymentStatus = 'paid';
    } else if (newTotalPaid > 0) {
      reservation.paymentStatus = 'partially_paid';
    }

    // Auto-close if fully paid
    if (reservation.paymentStatus === 'paid') {
      reservation.isClosed = true;
      reservation.closedAt = new Date();
    }

    await reservation.save();

    return res.status(200).json({
      success: true,
      message: `Payment of $${amount} collected via ${method}`,
      data: {
        payment: reservation.payments[reservation.payments.length - 1],
        paymentStatus: reservation.paymentStatus,
        isClosed: reservation.isClosed,
        remainingBalance: remaining - amount
      }
    });
  } catch (error) {
    console.error('Collect payment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to collect payment' });
  }
};

// ============ GENERATE PAYMENT LINK ============
const generatePaymentLink = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Calculate remaining balance
    const totalPaid = reservation.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = reservation.pricing.total - totalPaid;

    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No remaining balance to collect'
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    reservation.paymentLink = {
      token,
      expiresAt,
      status: 'active'
    };

    await reservation.save();

    const paymentLink = `${process.env.FRONTEND_URL}/pay/${token}`;

    return res.status(200).json({
      success: true,
      data: {
        paymentLink,
        token,
        expiresAt,
        amount: remaining,
        reservationNumber: reservation.reservationNumber
      }
    });
  } catch (error) {
    console.error('Generate payment link error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate payment link' });
  }
};

// ============ PROCESS PAYMENT LINK (Public) ============
const processPaymentLink = async (req, res) => {
  try {
    const { token } = req.params;
    const { paymentMethod } = req.body;

    const reservation = await Reservation.findOne({
      'paymentLink.token': token,
      'paymentLink.status': 'active',
      'paymentLink.expiresAt': { $gt: new Date() }
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Invalid or expired payment link' });
    }

    // Calculate remaining balance
    const totalPaid = reservation.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = reservation.pricing.total - totalPaid;

    // Process payment (simplified - in production, integrate with Stripe/PayPal)
    reservation.payments.push({
      amount: remaining,
      method: 'online',
      reference: `PAY-${token.slice(0, 8)}`,
      notes: 'Paid via payment link',
      collectedBy: null,
      collectedAt: new Date(),
      status: 'completed'
    });

    reservation.paymentStatus = 'paid';
    reservation.isClosed = true;
    reservation.closedAt = new Date();
    reservation.paymentLink.status = 'used';

    await reservation.save();

    return res.status(200).json({
      success: true,
      message: 'Payment successful!',
      data: { reservationNumber: reservation.reservationNumber }
    });
  } catch (error) {
    console.error('Process payment link error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
};

// ============ GET PAYMENT HISTORY ============
const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    }).select('payments paymentStatus pricing.total');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const totalPaid = reservation.payments.reduce((sum, p) => sum + p.amount, 0);

    return res.status(200).json({
      success: true,
      data: {
        payments: reservation.payments,
        totalAmount: reservation.pricing.total,
        totalPaid,
        remainingBalance: reservation.pricing.total - totalPaid,
        paymentStatus: reservation.paymentStatus
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
};

// ============ CLOSE RESERVATION (Manual) ============
const closeReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findOne({
      _id: id,
      operatorId: req.user._id,
      isDeleted: false
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Check if fully paid
    const totalPaid = reservation.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < reservation.pricing.total) {
      return res.status(400).json({
        success: false,
        message: `Cannot close. Remaining balance: $${(reservation.pricing.total - totalPaid).toFixed(2)}`
      });
    }

    reservation.isClosed = true;
    reservation.closedAt = new Date();
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: 'Reservation closed successfully',
      data: reservation
    });
  } catch (error) {
    console.error('Close reservation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to close reservation' });
  }
};

// ============ VALIDATE PAYMENT LINK ============
const validatePaymentLink = async (req, res) => {
  try {
    const { token } = req.params;

    const reservation = await Reservation.findOne({
      'paymentLink.token': token,
      'paymentLink.status': 'active',
      'paymentLink.expiresAt': { $gt: new Date() }
    }).select('reservationNumber paymentLink pricing total payments');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired payment link'
      });
    }

    // Calculate remaining balance
    const totalPaid = reservation.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = reservation.pricing.total - totalPaid;

    return res.status(200).json({
      success: true,
      data: {
        reservationNumber: reservation.reservationNumber,
        amount: remaining,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Validate payment link error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate payment link'
    });
  }
};


module.exports = {
  collectPayment,
  generatePaymentLink,
  validatePaymentLink,
  processPaymentLink,
  getPaymentHistory,
  closeReservation
};