const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require('../controllers/companyController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.post('/create', upload.single('photo'), createCompany);

router.get('/list', getCompanies);

router.get('/:id', getCompanyById);

router.put('/update/:id', upload.single('photo'), updateCompany);

router.delete('/delete/:id', deleteCompany);

module.exports = router;