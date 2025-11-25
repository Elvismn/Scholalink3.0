const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createParent,
  getParents,
  getParent,
  updateParent,
  deleteParent,
} = require('../../controllers/admin/parentController');

router.use(auth, requireRole(['admin', 'super_admin']));

router.get('/', getParents);
router.get('/:id', getParent);
router.post('/', createParent);
router.put('/:id', updateParent);
router.delete('/:id', deleteParent);

module.exports = router;