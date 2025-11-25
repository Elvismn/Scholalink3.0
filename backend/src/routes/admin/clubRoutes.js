const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  createClub,
  getClubs,
  getClub,
  updateClub,
  deleteClub,
} = require('../../controllers/admin/clubController');

router.use(auth, requireRole(['admin', 'super_admin', 'teacher']));

router.get('/', getClubs);
router.get('/:id', getClub);
router.post('/', createClub);
router.put('/:id', updateClub);
router.delete('/:id', deleteClub);

module.exports = router;