const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  getMyProfile,
  updateMyProfile
} = require('../../controllers/parents/profileController');

// All routes require parent authentication
router.use(auth, requireRole(['parent']));

router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);

module.exports = router;