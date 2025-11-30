const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  getMaintenanceRecords,
  getMaintenanceRecord,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  verifyMaintenanceRecord,
  getMaintenanceAnalytics,
  getUpcomingMaintenance,
  getMaintenanceForecast
} = require('../../controllers/admin/maintenanceController');

router.use(auth, requireRole(['admin', 'super_admin']));

// Maintenance record CRUD operations
router.get('/', getMaintenanceRecords);
router.get('/upcoming', getUpcomingMaintenance);
router.get('/:id', getMaintenanceRecord);
router.get('/vehicle/:vehicleId/analytics', getMaintenanceAnalytics);
router.get('/vehicle/:vehicleId/forecast', getMaintenanceForecast);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.delete('/:id', deleteMaintenanceRecord);
router.patch('/:id/verify', verifyMaintenanceRecord);

module.exports = router;