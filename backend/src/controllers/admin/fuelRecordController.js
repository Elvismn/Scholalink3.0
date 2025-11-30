const FuelRecord = require('../../models/FuelRecord');
const Vehicle = require('../../models/Vehicle');

// Get all fuel records with advanced filtering
const getFuelRecords = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      vehicle, 
      startDate, 
      endDate,
      station,
      filledBy,
      verified,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (station) filter.station = { $regex: station, $options: 'i' };
    if (filledBy) filter.filledBy = filledBy;
    if (verified !== undefined) filter.verified = verified === 'true';

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const fuelRecords = await FuelRecord.find(filter)
      .populate('vehicle', 'plateNumber make model')
      .populate('filledBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FuelRecord.countDocuments(filter);

    // Get statistics
    const stats = await FuelRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$totalCost' },
          totalLiters: { $sum: '$liters' },
          averageCostPerLiter: { $avg: '$costPerLiter' },
          recordCount: { $sum: 1 },
          averageLitersPerRecord: { $avg: '$liters' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        fuelRecords,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: stats[0] || {
          totalCost: 0,
          totalLiters: 0,
          averageCostPerLiter: 0,
          recordCount: 0,
          averageLitersPerRecord: 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Get fuel records error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single fuel record
const getFuelRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const fuelRecord = await FuelRecord.findById(id)
      .populate('vehicle', 'plateNumber make model fuelType currentOdometer')
      .populate('filledBy', 'firstName lastName email phone')
      .populate('verifiedBy', 'firstName lastName');

    if (!fuelRecord) {
      return res.status(404).json({
        success: false,
        error: 'Fuel record not found'
      });
    }

    res.json({
      success: true,
      data: { fuelRecord }
    });
  } catch (error) {
    console.error('❌ Get fuel record error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new fuel record
const createFuelRecord = async (req, res) => {
  try {
    const fuelData = req.body;

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(fuelData.vehicle);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check if odometer reading is logical (not less than current)
    if (fuelData.odometerReading && fuelData.odometerReading < vehicle.currentOdometer) {
      return res.status(400).json({
        success: false,
        error: `Odometer reading (${fuelData.odometerReading}) cannot be less than vehicle's current odometer (${vehicle.currentOdometer})`
      });
    }

    // Calculate total cost if not provided
    if (fuelData.liters && fuelData.costPerLiter && !fuelData.totalCost) {
      fuelData.totalCost = fuelData.liters * fuelData.costPerLiter;
    }

    const fuelRecord = await FuelRecord.create(fuelData);
    
    // Update vehicle's current odometer
    if (fuelData.odometerReading > vehicle.currentOdometer) {
      await Vehicle.findByIdAndUpdate(
        fuelData.vehicle,
        { currentOdometer: fuelData.odometerReading }
      );
    }

    await fuelRecord.populate([
      { path: 'vehicle', select: 'plateNumber make model' },
      { path: 'filledBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: { fuelRecord }
    });
  } catch (error) {
    console.error('❌ Create fuel record error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update fuel record
const updateFuelRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const fuelRecord = await FuelRecord.findById(id);
    if (!fuelRecord) {
      return res.status(404).json({
        success: false,
        error: 'Fuel record not found'
      });
    }

    // If vehicle is being changed, verify new vehicle exists
    if (updateData.vehicle && updateData.vehicle !== fuelRecord.vehicle.toString()) {
      const vehicle = await Vehicle.findById(updateData.vehicle);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }
    }

    // Update vehicle odometer if odometer reading is changed
    if (updateData.odometerReading && updateData.odometerReading !== fuelRecord.odometerReading) {
      const vehicleId = updateData.vehicle || fuelRecord.vehicle;
      const vehicle = await Vehicle.findById(vehicleId);
      
      if (updateData.odometerReading > vehicle.currentOdometer) {
        await Vehicle.findByIdAndUpdate(
          vehicleId,
          { currentOdometer: updateData.odometerReading }
        );
      }
    }

    const updatedRecord = await FuelRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'vehicle', select: 'plateNumber make model' },
      { path: 'filledBy', select: 'firstName lastName' },
      { path: 'verifiedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      data: { fuelRecord: updatedRecord }
    });
  } catch (error) {
    console.error('❌ Update fuel record error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete fuel record
const deleteFuelRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const fuelRecord = await FuelRecord.findByIdAndDelete(id);

    if (!fuelRecord) {
      return res.status(404).json({
        success: false,
        error: 'Fuel record not found'
      });
    }

    res.json({
      success: true,
      message: 'Fuel record deleted successfully',
      data: { fuelRecord }
    });
  } catch (error) {
    console.error('❌ Delete fuel record error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Verify fuel record
const verifyFuelRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifiedBy } = req.body;

    const fuelRecord = await FuelRecord.findById(id);
    if (!fuelRecord) {
      return res.status(404).json({
        success: false,
        error: 'Fuel record not found'
      });
    }

    fuelRecord.verified = true;
    fuelRecord.verifiedBy = verifiedBy;
    fuelRecord.verificationDate = new Date();

    await fuelRecord.save();
    await fuelRecord.populate('verifiedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Fuel record verified successfully',
      data: { fuelRecord }
    });
  } catch (error) {
    console.error('❌ Verify fuel record error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get fuel analytics for a vehicle
const getFuelAnalytics = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Monthly fuel consumption
    const monthlyFuel = await FuelRecord.aggregate([
      { 
        $match: { 
          vehicle: vehicle._id,
          date: { 
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$date' } },
          totalCost: { $sum: '$totalCost' },
          totalLiters: { $sum: '$liters' },
          averageCostPerLiter: { $avg: '$costPerLiter' },
          recordCount: { $sum: 1 },
          months: { $addToSet: { $month: '$date' } }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Station-wise spending
    const stationAnalytics = await FuelRecord.aggregate([
      { $match: { vehicle: vehicle._id } },
      {
        $group: {
          _id: '$station',
          totalCost: { $sum: '$totalCost' },
          totalLiters: { $sum: '$liters' },
          averageCostPerLiter: { $avg: '$costPerLiter' },
          recordCount: { $sum: 1 },
          lastVisit: { $max: '$date' }
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: 10 }
    ]);

    // Fuel efficiency calculation (requires odometer data)
    const fuelEfficiency = await FuelRecord.aggregate([
      { 
        $match: { 
          vehicle: vehicle._id,
          odometerReading: { $exists: true, $ne: null }
        }
      },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: null,
          records: { $push: '$$ROOT' },
          firstOdometer: { $first: '$odometerReading' },
          lastOdometer: { $last: '$odometerReading' },
          totalLiters: { $sum: '$liters' }
        }
      }
    ]);

    let efficiencyStats = null;
    if (fuelEfficiency.length > 0) {
      const data = fuelEfficiency[0];
      const totalDistance = data.lastOdometer - data.firstOdometer;
      
      if (totalDistance > 0 && data.totalLiters > 0) {
        efficiencyStats = {
          totalDistance,
          totalLiters: data.totalLiters,
          averageEfficiency: totalDistance / data.totalLiters, // km per liter
          averageConsumption: data.totalLiters / totalDistance // liters per km
        };
      }
    }

    // Year-over-year comparison
    const previousYear = parseInt(year) - 1;
    const yearlyComparison = await FuelRecord.aggregate([
      {
        $match: {
          vehicle: vehicle._id,
          date: {
            $gte: new Date(`${previousYear}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$date' } },
          totalCost: { $sum: '$totalCost' },
          totalLiters: { $sum: '$liters' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        vehicle: {
          plateNumber: vehicle.plateNumber,
          make: vehicle.make,
          model: vehicle.model,
          fuelType: vehicle.fuelType
        },
        analytics: {
          monthlyFuel,
          stationAnalytics,
          fuelEfficiency: efficiencyStats,
          yearlyComparison,
          summary: {
            totalRecords: monthlyFuel.reduce((sum, item) => sum + item.recordCount, 0),
            totalCost: monthlyFuel.reduce((sum, item) => sum + item.totalCost, 0),
            totalLiters: monthlyFuel.reduce((sum, item) => sum + item.totalLiters, 0)
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Get fuel analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get fuel records needing verification
const getUnverifiedFuelRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const fuelRecords = await FuelRecord.find({ verified: false })
      .populate('vehicle', 'plateNumber make model')
      .populate('filledBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FuelRecord.countDocuments({ verified: false });

    res.json({
      success: true,
      data: {
        fuelRecords,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('❌ Get unverified fuel records error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getFuelRecords,
  getFuelRecord,
  createFuelRecord,
  updateFuelRecord,
  deleteFuelRecord,
  verifyFuelRecord,
  getFuelAnalytics,
  getUnverifiedFuelRecords
};