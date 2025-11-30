const MaintenanceRecord = require('../../models/MaintenanceRecord');
const Vehicle = require('../../models/Vehicle');

// Get all maintenance records with advanced filtering
const getMaintenanceRecords = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      vehicle, 
      type,
      status,
      garage,
      startDate,
      endDate,
      approvedBy,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (garage) filter.garage = { $regex: garage, $options: 'i' };
    if (approvedBy) filter.approvedBy = approvedBy;

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const maintenanceRecords = await MaintenanceRecord.find(filter)
      .populate('vehicle', 'plateNumber make model currentOdometer')
      .populate('approvedBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MaintenanceRecord.countDocuments(filter);

    // Get statistics
    const stats = await MaintenanceRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          averageCost: { $avg: '$cost' },
          recordCount: { $sum: 1 },
          completedCount: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
          },
          pendingCount: { 
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } 
          }
        }
      }
    ]);

    // Get cost by type
    const costByType = await MaintenanceRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          totalCost: { $sum: '$cost' },
          averageCost: { $avg: '$cost' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        maintenanceRecords,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: stats[0] || {
          totalCost: 0,
          averageCost: 0,
          recordCount: 0,
          completedCount: 0,
          pendingCount: 0
        },
        costByType
      }
    });
  } catch (error) {
    console.error('❌ Get maintenance records error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single maintenance record
const getMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const maintenanceRecord = await MaintenanceRecord.findById(id)
      .populate('vehicle', 'plateNumber make model currentOdometer fuelType')
      .populate('approvedBy', 'firstName lastName email phone')
      .populate('verifiedBy', 'firstName lastName');

    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found'
      });
    }

    res.json({
      success: true,
      data: { maintenanceRecord }
    });
  } catch (error) {
    console.error('❌ Get maintenance record error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new maintenance record
const createMaintenanceRecord = async (req, res) => {
  try {
    const maintenanceData = req.body;

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(maintenanceData.vehicle);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check if odometer reading is logical
    if (maintenanceData.odometerReading && maintenanceData.odometerReading < vehicle.currentOdometer) {
      return res.status(400).json({
        success: false,
        error: `Odometer reading (${maintenanceData.odometerReading}) cannot be less than vehicle's current odometer (${vehicle.currentOdometer})`
      });
    }

    // Calculate next service odometer if not provided
    if (maintenanceData.odometerReading && maintenanceData.serviceInterval && !maintenanceData.nextServiceOdometer) {
      maintenanceData.nextServiceOdometer = maintenanceData.odometerReading + maintenanceData.serviceInterval;
    }

    // Calculate next service date if not provided (default 6 months)
    if (!maintenanceData.nextServiceDate && maintenanceData.status === 'completed') {
      const nextService = new Date();
      nextService.setMonth(nextService.getMonth() + 6);
      maintenanceData.nextServiceDate = nextService;
    }

    const maintenanceRecord = await MaintenanceRecord.create(maintenanceData);
    
    // Update vehicle's current odometer if this reading is higher
    if (maintenanceData.odometerReading > vehicle.currentOdometer) {
      await Vehicle.findByIdAndUpdate(
        maintenanceData.vehicle,
        { 
          currentOdometer: maintenanceData.odometerReading,
          lastServiceOdometer: maintenanceData.odometerReading,
          nextServiceOdometer: maintenanceData.nextServiceOdometer
        }
      );
    }

    await maintenanceRecord.populate([
      { path: 'vehicle', select: 'plateNumber make model' },
      { path: 'approvedBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: { maintenanceRecord }
    });
  } catch (error) {
    console.error('❌ Create maintenance record error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update maintenance record
const updateMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const maintenanceRecord = await MaintenanceRecord.findById(id);
    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found'
      });
    }

    // If vehicle is being changed, verify new vehicle exists
    if (updateData.vehicle && updateData.vehicle !== maintenanceRecord.vehicle.toString()) {
      const vehicle = await Vehicle.findById(updateData.vehicle);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }
    }

    // Update completion date if status changed to completed
    if (updateData.status === 'completed' && maintenanceRecord.status !== 'completed') {
      updateData.completionDate = new Date();
    }

    const updatedRecord = await MaintenanceRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'vehicle', select: 'plateNumber make model currentOdometer' },
      { path: 'approvedBy', select: 'firstName lastName' },
      { path: 'verifiedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      data: { maintenanceRecord: updatedRecord }
    });
  } catch (error) {
    console.error('❌ Update maintenance record error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete maintenance record
const deleteMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const maintenanceRecord = await MaintenanceRecord.findByIdAndDelete(id);

    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully',
      data: { maintenanceRecord }
    });
  } catch (error) {
    console.error('❌ Delete maintenance record error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Verify maintenance record
const verifyMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifiedBy } = req.body;

    const maintenanceRecord = await MaintenanceRecord.findById(id);
    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found'
      });
    }

    maintenanceRecord.verified = true;
    maintenanceRecord.verifiedBy = verifiedBy;
    maintenanceRecord.verificationDate = new Date();

    await maintenanceRecord.save();
    await maintenanceRecord.populate('verifiedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Maintenance record verified successfully',
      data: { maintenanceRecord }
    });
  } catch (error) {
    console.error('❌ Verify maintenance record error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get maintenance analytics for a vehicle
const getMaintenanceAnalytics = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Monthly maintenance costs
    const monthlyMaintenance = await MaintenanceRecord.aggregate([
      { 
        $match: { 
          vehicle: vehicle._id,
          status: 'completed',
          date: { 
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$date' } },
          totalCost: { $sum: '$cost' },
          averageCost: { $avg: '$cost' },
          recordCount: { $sum: 1 },
          types: { $addToSet: '$type' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Maintenance type analysis
    const typeAnalysis = await MaintenanceRecord.aggregate([
      { 
        $match: { 
          vehicle: vehicle._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          totalCost: { $sum: '$cost' },
          averageCost: { $avg: '$cost' },
          recordCount: { $sum: 1 },
          lastMaintenance: { $max: '$date' },
          averageOdometerInterval: { $avg: '$odometerReading' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    // Garage performance
    const garageAnalysis = await MaintenanceRecord.aggregate([
      { 
        $match: { 
          vehicle: vehicle._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$garage',
          totalCost: { $sum: '$cost' },
          averageCost: { $avg: '$cost' },
          recordCount: { $sum: 1 },
          lastVisit: { $max: '$date' },
          types: { $addToSet: '$type' }
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: 10 }
    ]);

    // Parts consumption analysis
    const partsAnalysis = await MaintenanceRecord.aggregate([
      { 
        $match: { 
          vehicle: vehicle._id,
          status: 'completed',
          'partsReplaced.0': { $exists: true }
        }
      },
      { $unwind: '$partsReplaced' },
      {
        $group: {
          _id: '$partsReplaced.name',
          totalCost: { $sum: '$partsReplaced.totalCost' },
          totalQuantity: { $sum: '$partsReplaced.quantity' },
          averageUnitCost: { $avg: '$partsReplaced.unitCost' },
          replacementCount: { $sum: 1 }
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: 15 }
    ]);

    // Cost per kilometer calculation
    const firstMaintenance = await MaintenanceRecord.findOne({ 
      vehicle: vehicle._id 
    }).sort({ date: 1 });

    const lastMaintenance = await MaintenanceRecord.findOne({ 
      vehicle: vehicle._id 
    }).sort({ date: -1 });

    let costPerKm = 0;
    let maintenanceDistance = 0;

    if (firstMaintenance && lastMaintenance && firstMaintenance.odometerReading) {
      maintenanceDistance = lastMaintenance.odometerReading - firstMaintenance.odometerReading;
      const totalMaintenanceCost = typeAnalysis.reduce((sum, item) => sum + item.totalCost, 0);
      
      if (maintenanceDistance > 0) {
        costPerKm = totalMaintenanceCost / maintenanceDistance;
      }
    }

    res.json({
      success: true,
      data: {
        vehicle: {
          plateNumber: vehicle.plateNumber,
          make: vehicle.make,
          model: vehicle.model,
          currentOdometer: vehicle.currentOdometer
        },
        analytics: {
          monthlyMaintenance,
          typeAnalysis,
          garageAnalysis,
          partsAnalysis,
          summary: {
            totalMaintenanceCost: typeAnalysis.reduce((sum, item) => sum + item.totalCost, 0),
            totalRecords: typeAnalysis.reduce((sum, item) => sum + item.recordCount, 0),
            maintenanceDistance,
            costPerKm: Math.round(costPerKm * 100) / 100,
            mostCommonType: typeAnalysis[0]?._id || 'N/A',
            mostExpensiveType: [...typeAnalysis].sort((a, b) => b.averageCost - a.averageCost)[0]?._id || 'N/A'
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Get maintenance analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get upcoming maintenance
const getUpcomingMaintenance = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const upcomingMaintenance = await MaintenanceRecord.find({
      $or: [
        { nextServiceDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }, // 30 days
        { 
          $expr: { 
            $lte: [
              { $arrayElemAt: ['$vehicle.currentOdometer', 0] },
              '$nextServiceOdometer'
            ]
          }
        }
      ],
      status: { $in: ['scheduled', 'in_progress'] }
    })
    .populate('vehicle', 'plateNumber make model currentOdometer')
    .populate('approvedBy', 'firstName lastName')
    .sort({ nextServiceDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await MaintenanceRecord.countDocuments({
      $or: [
        { nextServiceDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        { 
          $expr: { 
            $lte: [
              { $arrayElemAt: ['$vehicle.currentOdometer', 0] },
              '$nextServiceOdometer'
            ]
          }
        }
      ],
      status: { $in: ['scheduled', 'in_progress'] }
    });

    res.json({
      success: true,
      data: {
        upcomingMaintenance,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('❌ Get upcoming maintenance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get maintenance cost forecast
const getMaintenanceForecast = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { months = 12 } = req.query;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Get historical maintenance data
    const historicalData = await MaintenanceRecord.aggregate([
      { 
        $match: { 
          vehicle: vehicle._id,
          status: 'completed',
          date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
        }
      },
      {
        $group: {
          _id: { month: { $month: '$date' } },
          monthlyCost: { $sum: '$cost' },
          recordCount: { $sum: 1 }
        }
      }
    ]);

    // Simple forecasting based on historical average
    const averageMonthlyCost = historicalData.length > 0 
      ? historicalData.reduce((sum, item) => sum + item.monthlyCost, 0) / historicalData.length
      : 0;

    const forecast = Array.from({ length: parseInt(months) }, (_, i) => {
      const forecastDate = new Date();
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
      
      return {
        month: forecastDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        forecastedCost: Math.round(averageMonthlyCost),
        confidence: historicalData.length > 6 ? 'high' : historicalData.length > 3 ? 'medium' : 'low'
      };
    });

    res.json({
      success: true,
      data: {
        vehicle: {
          plateNumber: vehicle.plateNumber,
          make: vehicle.make,
          model: vehicle.model
        },
        forecast: {
          historicalData,
          averageMonthlyCost: Math.round(averageMonthlyCost),
          monthlyForecast: forecast,
          totalForecast: Math.round(averageMonthlyCost * parseInt(months))
        }
      }
    });
  } catch (error) {
    console.error('❌ Get maintenance forecast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getMaintenanceRecords,
  getMaintenanceRecord,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  verifyMaintenanceRecord,
  getMaintenanceAnalytics,
  getUpcomingMaintenance,
  getMaintenanceForecast
};