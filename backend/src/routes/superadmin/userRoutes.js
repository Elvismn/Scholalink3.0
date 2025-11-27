const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  getAllUsers,
  getUserAnalytics,
  createAdmin,
  updateUserRole,
  deactivateUser,
  getSystemStats
} = require('../../controllers/superadmin/userController');

router.use(auth, requireRole(['super_admin']));

router.get('/users', getAllUsers);
router.get('/analytics', getUserAnalytics);
router.get('/stats', getSystemStats);
router.post('/admins', createAdmin);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/deactivate', deactivateUser);

module.exports = router;