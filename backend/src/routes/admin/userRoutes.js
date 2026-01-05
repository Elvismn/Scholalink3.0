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
  changePassword
} = require('../../controllers/admin/userController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔧 USER ROUTE: ${req.method} ${req.originalUrl}`);
  next();
});

router.use(auth, requireRole(['admin', 'super_admin']));

router.get('/', getUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Add a test route first
router.get('/test-route', (req, res) => {
  console.log('✅ Test route hit!');
  res.json({ success: true, message: 'Test route working' });
});

// Then the actual password change route
router.put('/change-password', changePassword);

module.exports = router;