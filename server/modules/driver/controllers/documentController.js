// modules/driver/controllers/documentController.js
const DriverDocument = require('../models/DriverDocument');
const Driver = require('../../../models/settings/Driver');
const { uploadToCloudinary, deleteFromCloudinary, getSignedUrl } = require('../../../utils/cloudinary');
const { sendDocumentNotification } = require('./notificationController');
// Helper to get driver doc
const getDriverDoc = async (userId) => Driver.findOne({ userId });

// ============ GET ALL DOCUMENTS WITH SIGNED URLS ============
const getDocuments = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const documents = await DriverDocument.find({ 
      driver: driver._id,
      operator: driver.operator
    }).sort({ createdAt: -1 });

    // Add signed URLs for viewing
    const documentsWithSignedUrls = documents.map(doc => {
      const docObj = doc.toObject();
      
      // Generate signed URL for viewing
      if (doc.cloudinaryPublicId) {
        docObj.viewUrl = getSignedUrl(doc.cloudinaryPublicId);
        docObj.downloadUrl = getSignedUrl(doc.cloudinaryPublicId, {
          flags: 'attachment',
          filename: doc.filename || 'document'
        });
      }
      
      return docObj;
    });

    return res.status(200).json({
      success: true,
      data: documentsWithSignedUrls
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET SINGLE DOCUMENT WITH SIGNED URL ============
const getDocumentById = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const document = await DriverDocument.findOne({
      _id: req.params.id,
      driver: driver._id,
      operator: driver.operator
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Add signed URLs
    const docObj = document.toObject();
    if (document.cloudinaryPublicId) {
      docObj.viewUrl = getSignedUrl(document.cloudinaryPublicId);
      docObj.downloadUrl = getSignedUrl(document.cloudinaryPublicId, {
        flags: 'attachment',
        filename: document.filename || 'document'
      });
    }

    return res.status(200).json({
      success: true,
      data: docObj
    });
  } catch (error) {
    console.error('Get document error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ UPLOAD DOCUMENT ============
const uploadDocument = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const { type, expiryDate, displayName } = req.body;
    
    const validTypes = ['license', 'insurance', 'background_check'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid document type. Must be: license, insurance, or background_check' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const docDisplayName = displayName || getDisplayNameForType(type);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: `drivers/${driver._id}/documents/${type}`,
      resource_type: 'auto',
      public_id: `${Date.now()}-${docDisplayName.replace(/\s/g, '_')}`
    });

    // Create document record
    const document = new DriverDocument({
      driver: driver._id,
      operator: driver.operator,
      type,
      displayName: docDisplayName,
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      filename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: 'pending',
      uploadedAt: new Date()
    });

    await document.save();

    // ============ SEND NOTIFICATION ============
    const io = req.app.get('io');
    await sendDocumentNotification(driver._id, document, 'uploaded', io);

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });


    // Return with signed URL
    const docObj = document.toObject();
    docObj.viewUrl = getSignedUrl(document.cloudinaryPublicId);

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: docObj
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ DELETE DOCUMENT ============
const deleteDocument = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const document = await DriverDocument.findOne({
      _id: req.params.id,
      driver: driver._id,
      operator: driver.operator
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete from Cloudinary using stored public ID
    if (document.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(document.cloudinaryPublicId);
        console.log('Deleted from Cloudinary:', document.cloudinaryPublicId);
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    await document.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ UPDATE DOCUMENT STATUS (Admin/Operator only) ============
const updateDocumentStatus = async (req, res) => {
  try {
    const { status, notes, rejectionReason } = req.body;
    const { id } = req.params;

    // Check if user is operator (admin)
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only operators can update document status' 
      });
    }

    const document = await DriverDocument.findById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Verify operator owns this document
    if (document.operator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this document' 
      });
    }

    document.status = status;
    document.notes = notes || document.notes;
    document.updatedAt = new Date();
    
    if (status === 'approved') {
      document.approvedBy = req.user._id;
      document.approvedAt = new Date();
    }
    
    if (status === 'rejected') {
      document.rejectionReason = rejectionReason || '';
    }

    await document.save();

    // ============ SEND NOTIFICATION ============
    const io = req.app.get('io');
    const driver = await Driver.findById(document.driver);
    if (driver) {
      await sendDocumentNotification(driver._id, document, status, io);
    }

    return res.status(200).json({
      success: true,
      message: 'Document status updated successfully',
      data: document
    });

    return res.status(200).json({
      success: true,
      message: 'Document status updated successfully',
      data: document
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET EXPIRING DOCUMENTS ============
const getExpiringDocuments = async (req, res) => {
  try {
    const driver = await getDriverDoc(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const daysThreshold = parseInt(req.query.days) || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const documents = await DriverDocument.find({
      driver: driver._id,
      operator: driver.operator,
      expiryDate: { 
        $ne: null,
        $lte: thresholdDate,
        $gte: new Date()
      },
      status: { $ne: 'expired' }
    }).sort({ expiryDate: 1 });

    return res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

function getDisplayNameForType(type) {
  const names = {
    license: "Driver's License",
    insurance: "Insurance",
    background_check: "Background Check"
  };
  return names[type] || type;
}

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  updateDocumentStatus,
  getExpiringDocuments
};