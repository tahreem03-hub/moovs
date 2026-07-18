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
} = require('../controller/memberController');
const { protect } = require('../middleware/auth');

//router.use(protect);

router.post('/create', createMember);
router.get('/list', getMembers);
router.get('/dropdown', getMemberDropdown);
router.get('/:id', getMemberById);
router.put('/update/:id', updateMember);
router.delete('/delete/:id', deleteMember);

module.exports = router;