const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createGrade,
  getGrades,
  getGrade,
  updateGrade,
  deleteGrade,
  publishGrades,
} = require('../../controllers/admin/gradeController');

router.use(auth, requireRole(['admin', 'super_admin', 'teacher']));

router.get('/', getGrades);
router.get('/:id', getGrade);
router.post('/', createGrade);
router.post('/publish', publishGrades);
router.put('/:id', updateGrade);
router.delete('/:id', deleteGrade);

module.exports = router;