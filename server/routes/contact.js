const express = require('express');
const router = express.Router();
const {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactDropdown,
} = require('../controllers/contactController');
const { isAuthenticated, authorizeOperator } = require('../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.post('/create', createContact);

router.get('/list', getContacts);

router.get('/dropdown', getContactDropdown);

router.get('/:id', getContactById);

router.patch('/update/:id', updateContact);

router.delete('/delete/:id', deleteContact);

module.exports = router;