const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  getChildGrades,
  getChildAcademicSummary,
  getChildDetails
} = require('../../controllers/parents/academicController');

// All routes require parent authentication
router.use(auth, requireRole(['parent']));

// Fix: Make sure these are properly defined functions
router.get('/children/:childId/grades', getChildGrades);
router.get('/children/:childId/academic-summary', getChildAcademicSummary);
router.get('/children/:childId/details', getChildDetails);

module.exports = router;