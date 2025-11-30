const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleAnalytics,
  getVehiclesNeedingService
} = require('../../controllers/admin/vehicleController');

router.use(auth, requireRole(['admin', 'super_admin']));

// Vehicle CRUD operations
router.get('/', getVehicles);
router.get('/needing-service', getVehiclesNeedingService);
router.get('/:id', getVehicle);
router.get('/:id/analytics', getVehicleAnalytics);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;