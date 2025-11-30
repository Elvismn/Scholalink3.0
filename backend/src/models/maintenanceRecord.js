const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
  // Vehicle Reference
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle reference is required']
  },
  
  // Maintenance Details
  date: {
    type: Date,
    required: [true, 'Maintenance date is required'],
    default: Date.now
  },
  type: {
    type: String,
    required: [true, 'Maintenance type is required'],
    enum: [
      'routine_service', 
      'oil_change', 
      'tire_replacement',
      'brake_repair',
      'engine_repair', 
      'electrical',
      'body_work',
      'accident_repair',
      'battery_replacement',
      'other'
    ],
    default: 'routine_service'
  },
  
  // Service Details
  description: {
    type: String,
    required: [true, 'Maintenance description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  cost: {
    type: Number,
    required: [true, 'Maintenance cost is required'],
    min: [0, 'Cost cannot be negative']
  },
  
  // Garage/Service Provider
  garage: {
    type: String,
    required: [true, 'Garage/service provider name is required'],
    trim: true
  },
  garageContact: {
    phone: String,
    email: String,
    address: String
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  
  // Odometer Tracking
  odometerReading: {
    type: Number,
    required: [true, 'Odometer reading is required'],
    min: [0, 'Odometer cannot be negative']
  },
  
  // Parts Replaced (Array for multiple parts)
  partsReplaced: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    partNumber: String,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    unitCost: {
      type: Number,
      min: 0
    },
    totalCost: {
      type: Number,
      min: 0
    }
  }],
  
  // Next Service Information
  nextServiceDate: {
    type: Date
  },
  nextServiceOdometer: {
    type: Number,
    min: [0, 'Odometer cannot be negative']
  },
  serviceInterval: {
    type: Number,
    default: 5000, // km
    min: [100, 'Service interval must be at least 100 km']
  },
  
  // Approval & Verification
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Approving staff member is required']
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'completed'
  },
  completionDate: {
    type: Date
  },
  
  // Additional Information
  warranty: {
    hasWarranty: Boolean,
    warrantyPeriod: Number, // in months
    warrantyDetails: String
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }

}, {
  timestamps: true
});

// Indexes for performance
maintenanceRecordSchema.index({ vehicle: 1, date: -1 });
maintenanceRecordSchema.index({ type: 1 });
maintenanceRecordSchema.index({ status: 1 });
maintenanceRecordSchema.index({ garage: 1 });
maintenanceRecordSchema.index({ nextServiceDate: 1 });

// Pre-save middleware to calculate parts total and set completion date
maintenanceRecordSchema.pre('save', function(next) {
  // Calculate total cost for parts if not provided
  if (this.partsReplaced && this.partsReplaced.length > 0) {
    this.partsReplaced.forEach(part => {
      if (part.quantity && part.unitCost && !part.totalCost) {
        part.totalCost = part.quantity * part.unitCost;
      }
    });
  }
  
  // Set completion date if status is completed
  if (this.status === 'completed' && !this.completionDate) {
    this.completionDate = new Date();
  }
  
  // Calculate next service odometer if not provided
  if (this.odometerReading && this.serviceInterval && !this.nextServiceOdometer) {
    this.nextServiceOdometer = this.odometerReading + this.serviceInterval;
  }
  
  next();
});

// Virtual for total parts cost
maintenanceRecordSchema.virtual('totalPartsCost').get(function() {
  if (!this.partsReplaced || this.partsReplaced.length === 0) return 0;
  return this.partsReplaced.reduce((total, part) => total + (part.totalCost || 0), 0);
});

// Virtual for labor cost (total cost - parts cost)
maintenanceRecordSchema.virtual('laborCost').get(function() {
  return this.cost - this.totalPartsCost;
});

// Static method to get maintenance statistics for a vehicle
maintenanceRecordSchema.statics.getMaintenanceStats = function(vehicleId, startDate, endDate) {
  const matchStage = { vehicle: vehicleId, status: 'completed' };
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    { $group: { 
        _id: null, 
        totalCost: { $sum: '$cost' },
        averageCost: { $avg: '$cost' },
        recordCount: { $sum: 1 },
        types: { $addToSet: '$type' }
    }}
  ]);
};

// Static method to get maintenance by type
maintenanceRecordSchema.statics.getMaintenanceByType = function(vehicleId, year) {
  return this.aggregate([
    { 
      $match: { 
        vehicle: vehicleId,
        status: 'completed',
        date: { 
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: '$type',
        totalCost: { $sum: '$cost' },
        recordCount: { $sum: 1 },
        averageCost: { $avg: '$cost' }
      }
    },
    { $sort: { totalCost: -1 } }
  ]);
};

// Method to check if maintenance is overdue
maintenanceRecordSchema.statics.getOverdueMaintenance = function() {
  return this.find({
    $or: [
      { nextServiceDate: { $lte: new Date() } },
      { 
        $expr: { 
          $lte: [
            { $arrayElemAt: ['$vehicle.currentOdometer', 0] },
            '$nextServiceOdometer'
          ]
        }
      }
    ],
    status: { $ne: 'completed' }
  }).populate('vehicle', 'plateNumber make model currentOdometer');
};

// Method to schedule next service
maintenanceRecordSchema.methods.scheduleNextService = function() {
  if (this.nextServiceDate || this.nextServiceOdometer) {
    return {
      nextServiceDate: this.nextServiceDate,
      nextServiceOdometer: this.nextServiceOdometer,
      serviceInterval: this.serviceInterval
    };
  }
  return null;
};

// Auto-populate related data
maintenanceRecordSchema.pre('find', function() {
  this.populate('vehicle', 'plateNumber make model currentOdometer')
       .populate('approvedBy', 'firstName lastName')
       .populate('verifiedBy', 'firstName lastName');
});

maintenanceRecordSchema.pre('findOne', function() {
  this.populate('vehicle', 'plateNumber make model currentOdometer')
       .populate('approvedBy', 'firstName lastName')
       .populate('verifiedBy', 'firstName lastName');
});

// Ensure virtual fields are serialized
maintenanceRecordSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);