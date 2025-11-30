const VehicleDocument = require('../../models/VehicleDocument');
const Vehicle = require('../../models/Vehicle');

// Get all vehicle documents with advanced filtering
const getVehicleDocuments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      vehicle, 
      documentType,
      status,
      provider,
      expiryStatus, // 'expired', 'critical', 'warning', 'valid'
      sortBy = 'expiryDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (documentType) filter.documentType = documentType;
    if (status) filter.status = status;
    if (provider) filter.provider = { $regex: provider, $options: 'i' };

    // Expiry status filter
    if (expiryStatus) {
      const today = new Date();
      switch (expiryStatus) {
        case 'expired':
          filter.expiryDate = { $lt: today };
          break;
        case 'critical':
          const criticalDate = new Date();
          criticalDate.setDate(criticalDate.getDate() + 7);
          filter.expiryDate = { $gte: today, $lte: criticalDate };
          break;
        case 'warning':
          const warningDate = new Date();
          warningDate.setDate(warningDate.getDate() + 30);
          filter.expiryDate = { $gte: today, $lte: warningDate };
          break;
        case 'valid':
          const validDate = new Date();
          validDate.setDate(validDate.getDate() + 30);
          filter.expiryDate = { $gt: validDate };
          break;
      }
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const vehicleDocuments = await VehicleDocument.find(filter)
      .populate('vehicle', 'plateNumber make model')
      .populate('verifiedBy', 'firstName lastName')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VehicleDocument.countDocuments(filter);

    // Get document statistics
    const stats = await VehicleDocument.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          expiredCount: { 
            $sum: { $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0] } 
          },
          expiringSoonCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $gte: ['$expiryDate', new Date()] },
                    { $lte: ['$expiryDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }
                  ]
                }, 1, 0
              ]
            }
          },
          verifiedCount: { 
            $sum: { $cond: ['$verified', 1, 0] } 
          }
        }
      }
    ]);

    // Get count by document type
    const countByType = await VehicleDocument.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 },
          expiredCount: { 
            $sum: { $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0] } 
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        vehicleDocuments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: stats[0] || {
          totalDocuments: 0,
          expiredCount: 0,
          expiringSoonCount: 0,
          verifiedCount: 0
        },
        countByType
      }
    });
  } catch (error) {
    console.error('❌ Get vehicle documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single vehicle document
const getVehicleDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicleDocument = await VehicleDocument.findById(id)
      .populate('vehicle', 'plateNumber make model year color')
      .populate('verifiedBy', 'firstName lastName email phone');

    if (!vehicleDocument) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle document not found'
      });
    }

    res.json({
      success: true,
      data: { vehicleDocument }
    });
  } catch (error) {
    console.error('❌ Get vehicle document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new vehicle document
const createVehicleDocument = async (req, res) => {
  try {
    const documentData = req.body;

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(documentData.vehicle);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check for duplicate document numbers for the same type
    if (documentData.documentNumber) {
      const existingDoc = await VehicleDocument.findOne({
        documentType: documentData.documentType,
        documentNumber: documentData.documentNumber,
        vehicle: documentData.vehicle
      });
      
      if (existingDoc) {
        return res.status(400).json({
          success: false,
          error: 'A document with this number already exists for this vehicle'
        });
      }
    }

    // Set default reminder days based on document type
    if (!documentData.reminderDays) {
      const defaultReminders = {
        'insurance': 30,
        'inspection_certificate': 30,
        'registration': 60,
        'fitness_certificate': 30,
        'road_license': 60,
        'emission_test': 30
      };
      documentData.reminderDays = defaultReminders[documentData.documentType] || 30;
    }

    const vehicleDocument = await VehicleDocument.create(documentData);
    
    await vehicleDocument.populate([
      { path: 'vehicle', select: 'plateNumber make model' },
      { path: 'verifiedBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: { vehicleDocument }
    });
  } catch (error) {
    console.error('❌ Create vehicle document error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update vehicle document
const updateVehicleDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vehicleDocument = await VehicleDocument.findById(id);
    if (!vehicleDocument) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle document not found'
      });
    }

    // If vehicle is being changed, verify new vehicle exists
    if (updateData.vehicle && updateData.vehicle !== vehicleDocument.vehicle.toString()) {
      const vehicle = await Vehicle.findById(updateData.vehicle);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }
    }

    // Check for duplicate document numbers if document number is being updated
    if (updateData.documentNumber && updateData.documentNumber !== vehicleDocument.documentNumber) {
      const existingDoc = await VehicleDocument.findOne({
        documentType: updateData.documentType || vehicleDocument.documentType,
        documentNumber: updateData.documentNumber,
        vehicle: updateData.vehicle || vehicleDocument.vehicle,
        _id: { $ne: id }
      });
      
      if (existingDoc) {
        return res.status(400).json({
          success: false,
          error: 'Another document with this number already exists for this vehicle'
        });
      }
    }

    const updatedDocument = await VehicleDocument.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'vehicle', select: 'plateNumber make model' },
      { path: 'verifiedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      data: { vehicleDocument: updatedDocument }
    });
  } catch (error) {
    console.error('❌ Update vehicle document error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete vehicle document
const deleteVehicleDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicleDocument = await VehicleDocument.findByIdAndDelete(id);

    if (!vehicleDocument) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle document not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle document deleted successfully',
      data: { vehicleDocument }
    });
  } catch (error) {
    console.error('❌ Delete vehicle document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Verify vehicle document
const verifyVehicleDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifiedBy } = req.body;

    const vehicleDocument = await VehicleDocument.findById(id);
    if (!vehicleDocument) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle document not found'
      });
    }

    vehicleDocument.verified = true;
    vehicleDocument.verifiedBy = verifiedBy;
    vehicleDocument.verificationDate = new Date();

    await vehicleDocument.save();
    await vehicleDocument.populate('verifiedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Vehicle document verified successfully',
      data: { vehicleDocument }
    });
  } catch (error) {
    console.error('❌ Verify vehicle document error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Renew vehicle document
const renewVehicleDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { newExpiryDate, newDocumentNumber, newPremium, notes } = req.body;

    const vehicleDocument = await VehicleDocument.findById(id);
    if (!vehicleDocument) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle document not found'
      });
    }

    // Create renewal record (you might want to store this in a separate collection)
    const renewalData = {
      originalDocument: vehicleDocument._id,
      previousExpiry: vehicleDocument.expiryDate,
      previousDocumentNumber: vehicleDocument.documentNumber,
      renewalDate: new Date(),
      newExpiryDate: newExpiryDate,
      newDocumentNumber: newDocumentNumber,
      notes: notes
    };

    // Update the document
    vehicleDocument.expiryDate = newExpiryDate;
    if (newDocumentNumber) {
      vehicleDocument.documentNumber = newDocumentNumber;
    }
    if (newPremium) {
      vehicleDocument.premium = newPremium;
    }
    vehicleDocument.status = 'active';
    vehicleDocument.verified = false; // Reset verification for new document
    vehicleDocument.verifiedBy = null;
    vehicleDocument.verificationDate = null;

    if (notes) {
      vehicleDocument.notes = notes;
    }

    await vehicleDocument.save();
    await vehicleDocument.populate([
      { path: 'vehicle', select: 'plateNumber make model' },
      { path: 'verifiedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Vehicle document renewed successfully',
      data: { 
        vehicleDocument,
        renewal: renewalData 
      }
    });
  } catch (error) {
    console.error('❌ Renew vehicle document error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get expiring documents
const getExpiringDocuments = async (req, res) => {
  try {
    const { days = 30, page = 1, limit = 10 } = req.query;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));

    const expiringDocuments = await VehicleDocument.find({
      expiryDate: { $lte: targetDate, $gte: new Date() },
      status: 'active'
    })
    .populate('vehicle', 'plateNumber make model assignedDriver')
    .populate('verifiedBy', 'firstName lastName')
    .sort({ expiryDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await VehicleDocument.countDocuments({
      expiryDate: { $lte: targetDate, $gte: new Date() },
      status: 'active'
    });

    // Categorize by urgency
    const criticalDate = new Date();
    criticalDate.setDate(criticalDate.getDate() + 7);

    const categorized = expiringDocuments.map(doc => ({
      ...doc.toObject(),
      urgency: doc.expiryDate <= criticalDate ? 'critical' : 'warning'
    }));

    res.json({
      success: true,
      data: {
        expiringDocuments: categorized,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        },
        summary: {
          critical: categorized.filter(doc => doc.urgency === 'critical').length,
          warning: categorized.filter(doc => doc.urgency === 'warning').length,
          total: total
        }
      }
    });
  } catch (error) {
    console.error('❌ Get expiring documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get expired documents
const getExpiredDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const expiredDocuments = await VehicleDocument.find({
      expiryDate: { $lt: new Date() },
      status: { $in: ['active', 'pending'] }
    })
    .populate('vehicle', 'plateNumber make model assignedDriver')
    .populate('verifiedBy', 'firstName lastName')
    .sort({ expiryDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await VehicleDocument.countDocuments({
      expiryDate: { $lt: new Date() },
      status: { $in: ['active', 'pending'] }
    });

    res.json({
      success: true,
      data: {
        expiredDocuments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('❌ Get expired documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get document analytics
const getDocumentAnalytics = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    let matchStage = {};
    if (vehicleId) {
      matchStage.vehicle = vehicleId;
    }

    // Document type distribution
    const typeDistribution = await VehicleDocument.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 },
          expiredCount: { 
            $sum: { $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0] } 
          },
          verifiedCount: { 
            $sum: { $cond: ['$verified', 1, 0] } 
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Expiry timeline (next 12 months)
    const expiryTimeline = await VehicleDocument.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { month: { $month: '$expiryDate' }, year: { $year: '$expiryDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Provider analysis
    const providerAnalysis = await VehicleDocument.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          documentTypes: { $addToSet: '$documentType' },
          totalPremium: { $sum: '$premium' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Verification status
    const verificationStats = await VehicleDocument.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$verified',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        analytics: {
          typeDistribution,
          expiryTimeline,
          providerAnalysis,
          verificationStats,
          summary: {
            totalDocuments: typeDistribution.reduce((sum, item) => sum + item.count, 0),
            expiredDocuments: typeDistribution.reduce((sum, item) => sum + item.expiredCount, 0),
            verifiedDocuments: typeDistribution.reduce((sum, item) => sum + item.verifiedCount, 0),
            uniqueProviders: providerAnalysis.length,
            mostCommonType: typeDistribution[0]?._id || 'N/A'
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Get document analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Bulk update document status
const bulkUpdateDocumentStatus = async (req, res) => {
  try {
    const { documentIds, status, verified, verifiedBy } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Document IDs array is required'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (verified !== undefined) updateData.verified = verified;
    if (verifiedBy) {
      updateData.verifiedBy = verifiedBy;
      updateData.verificationDate = new Date();
    }

    const result = await VehicleDocument.updateMany(
      { _id: { $in: documentIds } },
      updateData
    );

    const updatedDocuments = await VehicleDocument.find({ _id: { $in: documentIds } })
      .populate('vehicle', 'plateNumber make model')
      .populate('verifiedBy', 'firstName lastName');

    res.json({
      success: true,
      message: `${result.modifiedCount} documents updated successfully`,
      data: {
        updatedCount: result.modifiedCount,
        documents: updatedDocuments
      }
    });
  } catch (error) {
    console.error('❌ Bulk update document status error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
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
};