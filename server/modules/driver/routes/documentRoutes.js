// modules/driver/routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadDocument, getDocuments, getDocumentById, deleteDocument, updateDocumentStatus, getExpiringDocuments } = require('../controllers/documentController');
const { isAuthenticated, authorizeDriver } = require('../../../middleware/auth');

// ============ CONFIGURE MULTER FOR MEMORY STORAGE (Cloudinary) ============
const storage = multer.memoryStorage(); // Store in memory, then upload to Cloudinary

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, PNG are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// All routes require authentication and driver role
router.use(isAuthenticated);
router.use(authorizeDriver);

// Document routes
router.post('/documents', upload.single('file'), uploadDocument);
router.get('/documents', getDocuments);
router.get('/documents/expiring', getExpiringDocuments);
router.get('/documents/:id', getDocumentById);
router.delete('/documents/:id', deleteDocument);
router.put('/documents/:id/status', updateDocumentStatus);

module.exports = router;