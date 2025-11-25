const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createStaff,
  getStaff,
  getOneStaff,
  updateStaff,
  deleteStaff,
} = require('../../controllers/admin/staffController');

router.use(auth, requireRole(['admin', 'super_admin']));

router.get('/', getStaff);
router.get('/:id', getOneStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;