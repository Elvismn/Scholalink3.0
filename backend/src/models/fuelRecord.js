const mongoose = require('mongoose');

const fuelRecordSchema = new mongoose.Schema({
  // Vehicle Reference
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle reference is required']
  },
  
  // Fuel Transaction Details
  date: {
    type: Date,
    required: [true, 'Fueling date is required'],
    default: Date.now
  },
  liters: {
    type: Number,
    required: [true, 'Fuel quantity in liters is required'],
    min: [0.1, 'Fuel quantity must be at least 0.1 liters']
  },
  costPerLiter: {
    type: Number,
    required: [true, 'Cost per liter is required'],
    min: [0, 'Cost cannot be negative']
  },
  totalCost: {
    type: Number,
    required: [true, 'Total cost is required'],
    min: [0, 'Total cost cannot be negative']
  },
  
  // Odometer Tracking
  odometerReading: {
    type: Number,
    required: [true, 'Odometer reading is required'],
    min: [0, 'Odometer cannot be negative']
  },
  
  // Station & Receipt Details
  station: {
    type: String,
    required: [true, 'Fuel station name is required'],
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  
  // Filled By Information
  filledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Person who filled fuel is required']
  },
  
  // Additional Details
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'premium', 'other'],
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Verification Fields
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  verificationDate: {
    type: Date
  }

}, {
  timestamps: true
});

// Indexes for performance
fuelRecordSchema.index({ vehicle: 1, date: -1 });
fuelRecordSchema.index({ date: -1 });
fuelRecordSchema.index({ filledBy: 1 });
fuelRecordSchema.index({ station: 1 });

// FIXED: Mongoose 9.x compatible pre-save middleware (no 'next' parameter)
fuelRecordSchema.pre('save', function() {
  try {
    if (this.liters && this.costPerLiter && !this.totalCost) {
      this.totalCost = this.liters * this.costPerLiter;
    }
  } catch (error) {
    throw error;
  }
});

// Virtual for fuel efficiency (if previous record exists)
fuelRecordSchema.virtual('fuelEfficiency').get(function() {
  // This would be calculated by comparing with previous odometer reading
  // Implementation would be in controller
  return null;
});

// Static method to get total fuel cost for a vehicle
fuelRecordSchema.statics.getTotalFuelCost = function(vehicleId, startDate, endDate) {
  const matchStage = { vehicle: vehicleId };
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    { $group: { 
        _id: null, 
        totalCost: { $sum: '$totalCost' },
        totalLiters: { $sum: '$liters' },
        averageCostPerLiter: { $avg: '$costPerLiter' },
        recordCount: { $sum: 1 }
    }}
  ]);
};

// Static method to get monthly fuel consumption
fuelRecordSchema.statics.getMonthlyFuelStats = function(vehicleId, year) {
  return this.aggregate([
    { 
      $match: { 
        vehicle: vehicleId,
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
        recordCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
};

// Method to verify a fuel record
fuelRecordSchema.methods.verifyRecord = function(verifiedByStaffId) {
  this.verified = true;
  this.verifiedBy = verifiedByStaffId;
  this.verificationDate = new Date();
  return this.save();
};

// Auto-populate vehicle and filledBy
fuelRecordSchema.pre('find', function() {
  this.populate('vehicle', 'plateNumber make model')
       .populate('filledBy', 'firstName lastName')
       .populate('verifiedBy', 'firstName lastName');
});

fuelRecordSchema.pre('findOne', function() {
  this.populate('vehicle', 'plateNumber make model')
       .populate('filledBy', 'firstName lastName')
       .populate('verifiedBy', 'firstName lastName');
});

// Ensure virtual fields are serialized
fuelRecordSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('FuelRecord', fuelRecordSchema);