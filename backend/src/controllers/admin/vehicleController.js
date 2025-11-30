const Vehicle = require('../../models/Vehicle');
const FuelRecord = require('../../models/FuelRecord');
const MaintenanceRecord = require('../../models/MaintenanceRecord');
const VehicleDocument = require('../../models/VehicleDocument');

// Get all vehicles with pagination and filtering
const getVehicles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      vehicleType, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (search) {
      filter.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const vehicles = await Vehicle.find(filter)
      .populate('assignedDriver', 'firstName lastName phone')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(filter);

    // Get additional statistics
    const stats = await Vehicle.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
          activeVehicles: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          totalValue: { $sum: '$currentValue' },
          averageAge: { $avg: { $subtract: [new Date().getFullYear(), '$year'] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalVehicles: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: stats[0] || {
          totalVehicles: 0,
          activeVehicles: 0,
          totalValue: 0,
          averageAge: 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Get vehicles error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single vehicle with detailed information
const getVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id)
      .populate('assignedDriver', 'firstName lastName phone email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Get recent fuel records
    const recentFuel = await FuelRecord.find({ vehicle: id })
      .sort({ date: -1 })
      .limit(5)
      .populate('filledBy', 'firstName lastName');

    // Get recent maintenance
    const recentMaintenance = await MaintenanceRecord.find({ vehicle: id })
      .sort({ date: -1 })
      .limit(5)
      .populate('approvedBy', 'firstName lastName');

    // Get expiring documents
    const expiringDocs = await VehicleDocument.find({ 
      vehicle: id,
      expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 days
    }).sort({ expiryDate: 1 });

    // Calculate total costs
    const fuelStats = await FuelRecord.aggregate([
      { $match: { vehicle: vehicle._id } },
      { $group: { _id: null, totalFuelCost: { $sum: '$totalCost' } } }
    ]);

    const maintenanceStats = await MaintenanceRecord.aggregate([
      { $match: { vehicle: vehicle._id, status: 'completed' } },
      { $group: { _id: null, totalMaintenanceCost: { $sum: '$cost' } } }
    ]);

    res.json({
      success: true,
      data: {
        vehicle,
        overview: {
          totalFuelCost: fuelStats[0]?.totalFuelCost || 0,
          totalMaintenanceCost: maintenanceStats[0]?.totalMaintenanceCost || 0,
          recentFuel,
          recentMaintenance,
          expiringDocuments: expiringDocs
        }
      }
    });
  } catch (error) {
    console.error('❌ Get vehicle error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new vehicle
const createVehicle = async (req, res) => {
  try {
    const vehicleData = req.body;

    // Check if plate number already exists
    const existingVehicle = await Vehicle.findOne({ 
      plateNumber: vehicleData.plateNumber 
    });
    
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle with this plate number already exists'
      });
    }

    // Set current value if not provided (same as purchase price for new vehicles)
    if (!vehicleData.currentValue && vehicleData.purchasePrice) {
      vehicleData.currentValue = vehicleData.purchasePrice;
    }

    const vehicle = await Vehicle.create(vehicleData);
    await vehicle.populate('assignedDriver', 'firstName lastName phone');

    res.status(201).json({
      success: true,
      data: { vehicle }
    });
  } catch (error) {
    console.error('❌ Create vehicle error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If plate number is being updated, check for duplicates
    if (updateData.plateNumber) {
      const existingVehicle = await Vehicle.findOne({
        plateNumber: updateData.plateNumber,
        _id: { $ne: id }
      });
      
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          error: 'Another vehicle with this plate number already exists'
        });
      }
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedDriver', 'firstName lastName phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: { vehicle }
    });
  } catch (error) {
    console.error('❌ Update vehicle error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete vehicle (soft delete by changing status)
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { status: 'retired' },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle marked as retired successfully',
      data: { vehicle }
    });
  } catch (error) {
    console.error('❌ Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get vehicle analytics
const getVehicleAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'monthly' } = req.query; // monthly, quarterly, yearly

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Fuel consumption analytics
    const fuelAnalytics = await FuelRecord.aggregate([
      { $match: { vehicle: vehicle._id } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalFuelCost: { $sum: '$totalCost' },
          totalLiters: { $sum: '$liters' },
          averageCostPerLiter: { $avg: '$costPerLiter' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Maintenance cost analytics
    const maintenanceAnalytics = await MaintenanceRecord.aggregate([
      { $match: { vehicle: vehicle._id, status: 'completed' } },
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

    // Cost per kilometer calculation
    const firstFuelRecord = await FuelRecord.findOne({ vehicle: vehicle._id }).sort({ date: 1 });
    const lastFuelRecord = await FuelRecord.findOne({ vehicle: vehicle._id }).sort({ date: -1 });

    let totalDistance = 0;
    let costPerKm = 0;

    if (firstFuelRecord && lastFuelRecord) {
      totalDistance = lastFuelRecord.odometerReading - firstFuelRecord.odometerReading;
      const totalFuelCost = fuelAnalytics.reduce((sum, item) => sum + item.totalFuelCost, 0);
      const totalMaintenanceCost = maintenanceAnalytics.reduce((sum, item) => sum + item.totalCost, 0);
      
      if (totalDistance > 0) {
        costPerKm = (totalFuelCost + totalMaintenanceCost) / totalDistance;
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
          fuel: fuelAnalytics,
          maintenance: maintenanceAnalytics,
          summary: {
            totalDistance,
            costPerKm: Math.round(costPerKm * 100) / 100, // Round to 2 decimal places
            totalFuelRecords: fuelAnalytics.reduce((sum, item) => sum + item.recordCount, 0),
            totalMaintenanceRecords: maintenanceAnalytics.reduce((sum, item) => sum + item.recordCount, 0)
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Get vehicle analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get vehicles needing service
const getVehiclesNeedingService = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      $or: [
        { nextServiceOdometer: { $lte: '$currentOdometer' } },
        { 
          _id: { 
            $in: await MaintenanceRecord.distinct('vehicle', { 
              nextServiceDate: { $lte: new Date() },
              status: { $ne: 'completed' }
            })
          }
        }
      ],
      status: 'active'
    }).populate('assignedDriver', 'firstName lastName');

    res.json({
      success: true,
      data: {
        vehicles,
        count: vehicles.length
      }
    });
  } catch (error) {
    console.error('❌ Get vehicles needing service error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleAnalytics,
  getVehiclesNeedingService
};