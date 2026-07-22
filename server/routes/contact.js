const express = require('express');
const router = express.Router();
const {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactDropdown,
} = require('../controller/contactController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.post('/create', createContact);

router.get('/list', getContacts);

router.get('/dropdown', getContactDropdown);

router.get('/:id', getContactById);

router.put('/update/:id', updateContact);

router.delete('/delete/:id', deleteContact);

module.exports = router;