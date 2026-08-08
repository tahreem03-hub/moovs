// modules/customer/controllers/invoiceController.js
const Contact = require('../../../models/Contact');
const Invoice = require('../../../models/Invoice');
// ============================================
// 1. GET INVOICES
// ============================================
const getInvoices = async (req, res) => {
    try {
        const { 
            from, 
            to, 
            limit = 20, 
            page = 1 
        } = req.query;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const skip = (page - 1) * limit;
        const filter = {
            customerId: contact._id,  
            isDeleted: false       
        };
        
        if (from) filter.createdAt = { $gte: new Date(from) };
        if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };

        const invoices = await Invoice.find(filter)
            .populate('reservationId', 'reservationNumber pickupDateTime tripType')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Invoice.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: invoices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 2. GET INVOICE DETAIL
// ============================================
const getInvoiceDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const invoice = await Invoice.findOne({
            _id: id,
            customerId: contact._id,  // ✅ Changed from contactId to customerId
            isDeleted: false           // ✅ Add this to filter out deleted invoices
        })
        .populate('reservationId', 'reservationNumber pickupDateTime tripType stops');

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
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 3. DOWNLOAD INVOICE PDF
// ============================================
const downloadInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const invoice = await Invoice.findOne({
            _id: id,
            customerId: contact._id,  // ✅ Changed from contactId to customerId
            isDeleted: false           // ✅ Add this to filter out deleted invoices
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Generate PDF (you'll need a PDF library like pdfkit or html-pdf)
        // const pdf = await generateInvoicePDF(invoice);
        
        // For now, return a placeholder
        return res.status(200).json({
            success: true,
            message: 'PDF generation coming soon',
            data: invoice
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = {
    getInvoices,
    getInvoiceDetail,
    downloadInvoicePDF
};