// routes/termsRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTerms,
  getTerms,
  getDefaultTerms,
  getTermsById,
  updateTerms,
  deleteTerms
} = require('../../controllers/settings/termsController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.post('/create', createTerms);
router.get('/list', getTerms);
router.get('/default', getDefaultTerms);
router.get('/:id', getTermsById);
router.patch('/update/:id', updateTerms);
router.delete('/delete/:id', deleteTerms);

module.exports = router;