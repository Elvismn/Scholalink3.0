const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Basic Identification
  plateNumber: {
    type: String,
    required: [true, 'Plate number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Manufacture year is required'],
    min: [1990, 'Year must be 1990 or later'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  
  // Vehicle Specifications
  vehicleType: {
    type: String,
    required: true,
    enum: ['bus', 'van', 'sedan', 'truck', 'minibus', 'other'],
    default: 'bus'
  },
  color: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Passenger capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    default: 'diesel'
  },
  fuelCapacity: {
    type: Number,
    required: [true, 'Fuel tank capacity is required'],
    min: [1, 'Fuel capacity must be at least 1 liter']
  },
  
  // Financial Information
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  currentValue: {
    type: Number,
    min: [0, 'Current value cannot be negative']
  },
  
  // Operational Status
  status: {
    type: String,
    enum: ['active', 'maintenance', 'accident', 'retired', 'sold'],
    default: 'active'
  },
  averageMileage: {
    type: Number,
    min: [0, 'Mileage cannot be negative'],
    default: 0
  },
  
  // School Assignment
  purpose: {
    type: String,
    enum: ['student_transport', 'staff_transport', 'goods_transport', 'multi_purpose'],
    default: 'student_transport'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  assignedRoute: {
    type: String,
    trim: true
  },
  
  // Tracking Fields
  currentOdometer: {
    type: Number,
    default: 0,
    min: [0, 'Odometer cannot be negative']
  },
  lastServiceOdometer: {
    type: Number,
    default: 0
  },
  nextServiceOdometer: {
    type: Number,
    default: 5000 // 5000 km service interval
  }
}, {
  timestamps: true
});

// Indexes for better query performance
vehicleSchema.index({ plateNumber: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ assignedDriver: 1 });

// Virtual for vehicle age
vehicleSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

// Virtual for depreciation (simplified)
vehicleSchema.virtual('depreciation').get(function() {
  if (!this.purchasePrice || !this.currentValue) return 0;
  return this.purchasePrice - this.currentValue;
});

// Method to check if service is due
vehicleSchema.methods.isServiceDue = function() {
  return this.currentOdometer >= this.nextServiceOdometer;
};

// Method to get utilization status
vehicleSchema.methods.getUtilization = function() {
  const statusPriority = {
    'active': 3,
    'maintenance': 2, 
    'accident': 1,
    'retired': 0,
    'sold': 0
  };
  return statusPriority[this.status] || 0;
};

// Auto-populate assigned driver
vehicleSchema.pre('find', function() {
  this.populate('assignedDriver', 'firstName lastName phone');
});

vehicleSchema.pre('findOne', function() {
  this.populate('assignedDriver', 'firstName lastName phone');
});

// Ensure virtual fields are serialized
vehicleSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);