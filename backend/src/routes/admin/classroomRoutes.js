const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createClassroom,
  getClassrooms,
  getClassroom,
  updateClassroom,
  deleteClassroom,
} = require('../../controllers/admin/classroomController');

// All routes require admin authentication
router.use(auth, requireRole(['admin', 'super_admin']));

router.get('/', getClassrooms);
router.get('/:id', getClassroom);
router.post('/', createClassroom);
router.put('/:id', updateClassroom);
router.delete('/:id', deleteClassroom);

module.exports = router;