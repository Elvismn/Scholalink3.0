const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  getMyChildren,
  getChildDetails
} = require('../../controllers/parents/childrenController');

// All routes require parent authentication
router.use(auth, requireRole(['parent']));

router.get('/children', getMyChildren);
router.get('/children/:childId', getChildDetails);

module.exports = router;