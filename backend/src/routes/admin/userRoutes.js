const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
} = require('../../controllers/admin/userController');

router.use(auth, requireRole(['admin', 'super_admin']));

router.get('/', getUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;