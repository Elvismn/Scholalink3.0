const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const {
  getVehicleDocuments,
  getVehicleDocument,
  createVehicleDocument,
  updateVehicleDocument,
  deleteVehicleDocument,
  verifyVehicleDocument,
  renewVehicleDocument,
  getExpiringDocuments,
  getExpiredDocuments,
  getDocumentAnalytics,
  bulkUpdateDocumentStatus
} = require('../../controllers/admin/vehicleDocumentController');

router.use(auth, requireRole(['admin', 'super_admin']));

// Vehicle document CRUD operations
router.get('/', getVehicleDocuments);
router.get('/expiring', getExpiringDocuments);
router.get('/expired', getExpiredDocuments);
router.get('/:id', getVehicleDocument);
router.get('/vehicle/:vehicleId/analytics', getDocumentAnalytics);
router.post('/', createVehicleDocument);
router.post('/bulk-update', bulkUpdateDocumentStatus);
router.put('/:id', updateVehicleDocument);
router.patch('/:id/renew', renewVehicleDocument);
router.patch('/:id/verify', verifyVehicleDocument);
router.delete('/:id', deleteVehicleDocument);

module.exports = router;