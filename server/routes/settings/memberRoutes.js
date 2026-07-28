// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getMemberDropdown
} = require('../../controllers/settings/memberController');
const { isAuthenticated, authorizeOperator } = require('../../middleware/auth');

// All routes require authentication + operator role
router.use(isAuthenticated);
router.use(authorizeOperator);

router.post('/create', createMember);
router.get('/list', getMembers);
router.get('/dropdown', getMemberDropdown);
router.get('/:id', getMemberById);
router.put('/update/:id', updateMember);
router.delete('/delete/:id', deleteMember);

module.exports = router;