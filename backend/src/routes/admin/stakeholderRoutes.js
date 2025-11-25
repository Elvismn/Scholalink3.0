const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createStakeholder,
  getStakeholders,
  getStakeholder,
  updateStakeholder,
  deleteStakeholder,
} = require('../../controllers/admin/stakeholderController');

router.use(auth, requireRole(['admin', 'super_admin']));

router.get('/', getStakeholders);
router.get('/:id', getStakeholder);
router.post('/', createStakeholder);
router.put('/:id', updateStakeholder);
router.delete('/:id', deleteStakeholder);

module.exports = router;