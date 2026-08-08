// controllers/invoiceController.js (operator)
const Invoice = require('../models/Invoice');
const Reservation = require('../models/Reservation');
const Contact = require('../models/Contact');

// ============ HELPER: Generate Invoice Number ============
const generateInvoiceNumber = async (operatorId) => {
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({
        operatorId: operatorId,
        createdAt: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31)
        }
    });
    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}-${sequence}`;
};

// ============ HELPER: Create Invoice from Reservation ============
const createInvoiceFromReservation = async (reservation, createdBy, options = {}) => {
    try {
        // Check if invoice already exists
        const existingInvoice = await Invoice.findOne({
            reservationId: reservation._id,
            isDeleted: false
        });

        if (existingInvoice) {
            return existingInvoice;
        }

        // ✅ Get customer details - handle both populated and unpopulated
        let customer = reservation.bookingContact;
        
        // If bookingContact is an ObjectId (not populated), fetch it
        if (customer && typeof customer === 'object' && customer._id) {
            // Already populated
        } else if (customer && typeof customer === 'string') {
            // It's just an ID, fetch the contact
            customer = await Contact.findById(customer).select('firstName lastName email phone');
        } else if (customer && customer.toString) {
            // It's an ObjectId
            customer = await Contact.findById(customer.toString()).select('firstName lastName email phone');
        }

        // ✅ Build invoice items from reservation pricing
        let items = [];
        
        if (reservation.pricing?.items && reservation.pricing.items.length > 0) {
            items = reservation.pricing.items.map(item => ({
                description: item.label || item.name || 'Service',
                quantity: 1,
                rate: item.amount || 0,
                amount: item.amount || 0
            }));
        } else {
            items.push({
                description: 'Transportation Service',
                quantity: 1,
                rate: reservation.pricing?.total || 0,
                amount: reservation.pricing?.total || 0
            });
        }

        const subtotal = reservation.pricing?.subtotal || reservation.pricing?.total || 0;
        const taxRate = reservation.pricing?.taxRate || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const discount = reservation.pricing?.discount || 0;
        const total = subtotal + taxAmount - discount;

        // ✅ Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(reservation.operatorId || createdBy);

        // ✅ Get customer name and email
        let customerName = 'Unknown Customer';
        let customerEmail = null;
        let customerPhone = null;

        if (customer) {
            if (customer.firstName || customer.lastName) {
                customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer';
            }
            customerEmail = customer.email || null;
            customerPhone = customer.phone?.number || customer.phone || null;
        }

        // Create invoice
        const invoiceData = {
            operatorId: reservation.operatorId || createdBy,
            reservationId: reservation._id,
            reservationNumber: reservation.reservationNumber,
            customerId: customer?._id || reservation.bookingContact,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            items: items,
            subtotal: Math.round(subtotal * 100) / 100,
            taxRate: taxRate,
            taxAmount: Math.round(taxAmount * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            total: Math.round(Math.max(0, total) * 100) / 100,
            currency: options.currency || 'USD',
            status: options.status || 'draft',
            dueDate: options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            notes: options.notes || `Invoice for reservation ${reservation.reservationNumber}`,
            createdBy: createdBy,
            invoiceNumber: invoiceNumber
        };

        const invoice = await Invoice.create(invoiceData);
        return invoice;

    } catch (error) {
        console.error('Create invoice from reservation error:', error);
        throw error;
    }
};

// controllers/invoiceController.js (operator)

// ============ GENERATE INVOICE FROM RESERVATION ============
const generateInvoiceFromReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;

        // ✅ Find the reservation WITHOUT population first
        const reservation = await Reservation.findOne({
            _id: reservationId,
            operatorId: req.user._id,
            isDeleted: false
        });

        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Reservation not found' 
            });
        }

        // ✅ Check if invoice already exists
        const existingInvoice = await Invoice.findOne({
            reservationId: reservation._id,
            isDeleted: false
        });

        if (existingInvoice) {
            return res.status(400).json({
                success: false,
                message: 'Invoice already exists for this reservation',
                data: existingInvoice
            });
        }

        // ✅ Get customer details DIRECTLY from Contact model
        let customerName = 'Unknown Customer';
        let customerEmail = null;
        let customerPhone = null;
        let customerId = null;

        if (reservation.bookingContact) {
            // ✅ Fetch the contact directly
            const customer = await Contact.findById(reservation.bookingContact)
                .select('firstName lastName email phone');

            if (customer) {
                customerId = customer._id;
                
                // Build name
                const firstName = customer.firstName || '';
                const lastName = customer.lastName || '';
                customerName = `${firstName} ${lastName}`.trim() || 'Unknown Customer';
                
                // Email
                customerEmail = customer.email || null;
                
                // Phone - handle the nested phone object
                if (customer.phone) {
                    if (typeof customer.phone === 'object') {
                        // If phone is an object with number property
                        customerPhone = customer.phone.number || null;
                    } else {
                        // If phone is a string
                        customerPhone = customer.phone || null;
                    }
                }
            } else {
                console.log('Customer not found for ID:', reservation.bookingContact);
            }
        } else {
            console.log('No bookingContact on reservation');
        }

        // ✅ Build invoice items from reservation pricing
        let items = [];
        
        if (reservation.pricing?.items && reservation.pricing.items.length > 0) {
            items = reservation.pricing.items.map(item => ({
                description: item.label || item.name || 'Service',
                quantity: 1,
                rate: item.amount || 0,
                amount: item.amount || 0
            }));
        } else {
            items.push({
                description: 'Transportation Service',
                quantity: 1,
                rate: reservation.pricing?.total || 0,
                amount: reservation.pricing?.total || 0
            });
        }

        const subtotal = reservation.pricing?.subtotal || reservation.pricing?.total || 0;
        const taxRate = reservation.pricing?.taxRate || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const discount = reservation.pricing?.discount || 0;
        const total = subtotal + taxAmount - discount;

        // ✅ Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(req.user._id);

        // ✅ Create invoice with customer details
        const invoice = await Invoice.create({
            operatorId: req.user._id,
            reservationId: reservation._id,
            reservationNumber: reservation.reservationNumber,
            customerId: customerId || reservation.bookingContact,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            items: items,
            subtotal: Math.round(subtotal * 100) / 100,
            taxRate: taxRate,
            taxAmount: Math.round(taxAmount * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            total: Math.round(Math.max(0, total) * 100) / 100,
            currency: 'USD',
            status: 'draft',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            notes: `Invoice for reservation ${reservation.reservationNumber}`,
            createdBy: req.user._id,
            invoiceNumber: invoiceNumber
        });

        return res.status(201).json({
            success: true,
            message: 'Invoice generated successfully',
            data: invoice
        });

    } catch (error) {
        console.error('Generate invoice error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate invoice'
        });
    }
};

// ============ CREATE INVOICE (Manual) ============
const createInvoice = async (req, res) => {
    try {
        const { reservationId, items, dueDate, notes } = req.body;

        // ✅ Find and populate the reservation
        const reservation = await Reservation.findOne({
            _id: reservationId,
            operatorId: req.user._id,
            isDeleted: false
        }).populate('bookingContact', 'firstName lastName email phone');

        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Reservation not found' 
            });
        }

        // Check if invoice already exists
        const existingInvoice = await Invoice.findOne({
            reservationId: reservation._id,
            isDeleted: false
        });

        if (existingInvoice) {
            return res.status(400).json({
                success: false,
                message: 'Invoice already exists for this reservation',
                data: existingInvoice
            });
        }

        // Calculate totals from provided items
        const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        const taxRate = reservation.pricing?.taxRate || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const discount = reservation.pricing?.discount || 0;
        const total = subtotal + taxAmount - discount;

        // ✅ Get customer details
        const customer = reservation.bookingContact;
        let customerName = 'Unknown Customer';
        let customerEmail = null;
        let customerPhone = null;

        if (customer) {
            if (customer.firstName || customer.lastName) {
                customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer';
            }
            customerEmail = customer.email || null;
            customerPhone = customer.phone?.number || customer.phone || null;
        }

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(req.user._id);

        const invoice = await Invoice.create({
            operatorId: req.user._id,
            reservationId: reservation._id,
            reservationNumber: reservation.reservationNumber,
            customerId: customer?._id || reservation.bookingContact,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            items: items.map(item => ({
                description: item.description || 'Service',
                quantity: item.quantity || 1,
                rate: item.rate || item.amount || 0,
                amount: item.amount || 0
            })),
            subtotal: subtotal,
            taxRate: taxRate,
            taxAmount: taxAmount,
            discount: discount,
            total: total,
            currency: 'USD',
            status: 'draft',
            dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            notes: notes || `Invoice for reservation ${reservation.reservationNumber}`,
            createdBy: req.user._id,
            invoiceNumber: invoiceNumber
        });

        return res.status(201).json({ 
            success: true, 
            message: 'Invoice created', 
            data: invoice 
        });

    } catch (error) {
        console.error('Create invoice error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to create invoice' 
        });
    }
};

// ============ REGENERATE INVOICE ============
const regenerateInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const existingInvoice = await Invoice.findOne({
            _id: id,
            operatorId: req.user._id,
            isDeleted: false
        });

        if (!existingInvoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // ✅ Find and populate the reservation
        const reservation = await Reservation.findOne({
            _id: existingInvoice.reservationId,
            operatorId: req.user._id,
            isDeleted: false
        }).populate('bookingContact', 'firstName lastName email phone');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // ✅ Delete old invoice
        existingInvoice.isDeleted = true;
        await existingInvoice.save();

        // ✅ Create new invoice using helper
        const newInvoice = await createInvoiceFromReservation(
            reservation,
            req.user._id,
            {
                status: existingInvoice.status,
                dueDate: existingInvoice.dueDate,
                notes: `Regenerated from previous invoice ${existingInvoice.invoiceNumber}`
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Invoice regenerated successfully',
            data: newInvoice
        });

    } catch (error) {
        console.error('Regenerate invoice error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to regenerate invoice'
        });
    }
};

// ============ GET INVOICES ============
const getInvoices = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const query = { operatorId: req.user._id, isDeleted: false };
        
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Invoice.find(query)
                .populate('reservationId', 'reservationNumber pickupDateTime tripType')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Invoice.countDocuments(query)
        ]);

        return res.status(200).json({ 
            success: true, 
            data, 
            pagination: { 
                total, 
                page: parseInt(page), 
                limit: parseInt(limit) 
            } 
        });

    } catch (error) {
        console.error('Get invoices error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to fetch invoices' 
        });
    }
};

// ============ GET INVOICE BY ID ============
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findOne({
            _id: id,
            operatorId: req.user._id,
            isDeleted: false
        }).populate('reservationId', 'reservationNumber pickupDateTime tripType');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: invoice
        });

    } catch (error) {
        console.error('Get invoice error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch invoice'
        });
    }
};

// ============ UPDATE INVOICE STATUS ============
const updateInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const invoice = await Invoice.findOne({ 
            _id: id, 
            operatorId: req.user._id,
            isDeleted: false
        });
        
        if (!invoice) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found' 
            });
        }

        invoice.status = status;
        if (status === 'paid') {
            invoice.paidAt = new Date();
        }
        await invoice.save();

        return res.status(200).json({ 
            success: true, 
            message: `Invoice ${status}`, 
            data: invoice 
        });

    } catch (error) {
        console.error('Update invoice status error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to update invoice' 
        });
    }
};

// ============ SEND INVOICE ============
const sendInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findOne({
            _id: id,
            operatorId: req.user._id,
            isDeleted: false
        });

        if (!invoice) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found' 
            });
        }

        if (!invoice.customerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Customer email not available'
            });
        }

        // Update invoice status
        invoice.status = 'sent';
        invoice.sentAt = new Date();
        await invoice.save();

        // TODO: Send email with nodemailer or email service
        // await sendInvoiceEmail(invoice);

        return res.status(200).json({
            success: true,
            message: `Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail}`,
            data: invoice
        });

    } catch (error) {
        console.error('Send invoice error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to send invoice'
        });
    }
};

// ============ MARK INVOICE AS PAID ============
const markInvoicePaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, transactionId } = req.body;

        const invoice = await Invoice.findOne({
            _id: id,
            operatorId: req.user._id,
            isDeleted: false
        });

        if (!invoice) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found' 
            });
        }

        if (invoice.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Invoice is already paid'
            });
        }

        invoice.status = 'paid';
        invoice.paidAt = new Date();
        if (paymentMethod) invoice.paymentMethod = paymentMethod;
        if (transactionId) invoice.transactionId = transactionId;
        await invoice.save();

        return res.status(200).json({
            success: true,
            message: `Invoice ${invoice.invoiceNumber} marked as paid`,
            data: invoice
        });

    } catch (error) {
        console.error('Mark invoice paid error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark invoice as paid'
        });
    }
};

// ============ GET INVOICE PDF ============
const getInvoicePdf = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findOne({
            _id: id,
            operatorId: req.user._id,
            isDeleted: false
        });

        if (!invoice) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invoice not found' 
            });
        }

        // Generate HTML invoice view
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
                    .invoice-title { font-size: 28px; font-weight: bold; color: #2563eb; }
                    .invoice-number { color: #666; }
                    .details { margin: 20px 0; display: flex; justify-content: space-between; }
                    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .table th { background: #f3f4f6; padding: 10px; text-align: left; }
                    .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
                    .total { text-align: right; font-size: 20px; font-weight: bold; color: #2563eb; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="invoice-title">INVOICE</h1>
                    <p class="invoice-number">${invoice.invoiceNumber}</p>
                </div>
                <div class="details">
                    <div>
                        <strong>Bill To:</strong><br>
                        ${invoice.customerName}<br>
                        ${invoice.customerEmail || ''}
                    </div>
                    <div>
                        <strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}<br>
                        <strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}
                    </div>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align:right">Rate</th>
                            <th style="text-align:right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td style="text-align:right">$${item.rate.toFixed(2)}</td>
                                <td style="text-align:right">$${item.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">
                    Total: $${invoice.total.toFixed(2)}
                </div>
                <div class="footer">
                    Thank you for your business!
                </div>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.send(html);

    } catch (error) {
        console.error('Get invoice PDF error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate invoice PDF'
        });
    }
};

// ============ DELETE INVOICE ============
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findOneAndUpdate(
            { _id: id, operatorId: req.user._id },
            { isDeleted: true }
        );
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Invoice deleted' 
        });

    } catch (error) {
        console.error('Delete invoice error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to delete invoice' 
        });
    }
};

// Export all functions
module.exports = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoiceStatus,
    deleteInvoice,
    generateInvoiceFromReservation,
    regenerateInvoice,
    sendInvoice,
    markInvoicePaid,
    getInvoicePdf
};