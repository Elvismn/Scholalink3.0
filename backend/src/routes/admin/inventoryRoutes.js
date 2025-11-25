const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createInventory,
  getInventories,
  getInventory,
  updateInventory,
  deleteInventory,
} = require('../../controllers/admin/inventoryController');

router.use(auth, requireRole(['admin', 'super_admin', 'staff']));

router.get('/', getInventories);
router.get('/:id', getInventory);
router.post('/', createInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

module.exports = router;