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
} = require('../controller/termsController');
const { protect } = require('../middleware/auth');

//router.use(protect);

router.post('/create', createTerms);
router.get('/list', getTerms);
router.get('/default', getDefaultTerms);
router.get('/:id', getTermsById);
router.put('/update/:id', updateTerms);
router.delete('/delete/:id', deleteTerms);

module.exports = router;