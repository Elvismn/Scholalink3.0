const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  getFuelRecords,
  getFuelRecord,
  createFuelRecord,
  updateFuelRecord,
  deleteFuelRecord,
  verifyFuelRecord,
  getFuelAnalytics,
  getUnverifiedFuelRecords
} = require('../../controllers/admin/fuelRecordController');

router.use(auth, requireRole(['admin', 'super_admin']));

// Fuel record CRUD operations
router.get('/', getFuelRecords);
router.get('/unverified', getUnverifiedFuelRecords);
router.get('/:id', getFuelRecord);
router.get('/vehicle/:vehicleId/analytics', getFuelAnalytics);
router.post('/', createFuelRecord);
router.put('/:id', updateFuelRecord);
router.delete('/:id', deleteFuelRecord);
router.patch('/:id/verify', verifyFuelRecord);

module.exports = router;