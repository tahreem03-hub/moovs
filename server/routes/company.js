const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require('../controller/companyController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.post('/create', upload.single('photo'), createCompany);

router.get('/list', getCompanies);

router.get('/:id', getCompanyById);

router.put('/update/:id', upload.single('photo'), updateCompany);

router.delete('/delete/:id', deleteCompany);

module.exports = router;