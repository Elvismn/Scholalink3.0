const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createCurriculum,
  getCurriculums,
  getCurriculum,
  updateCurriculum,
  deleteCurriculum,
} = require('../../controllers/admin/curriculumController');

router.use(auth, requireRole(['admin', 'super_admin', 'teacher']));

router.get('/', getCurriculums);
router.get('/:id', getCurriculum);
router.post('/', createCurriculum);
router.put('/:id', updateCurriculum);
router.delete('/:id', deleteCurriculum);

module.exports = router;