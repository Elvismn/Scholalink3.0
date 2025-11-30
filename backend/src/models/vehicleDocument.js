const mongoose = require('mongoose');

const vehicleDocumentSchema = new mongoose.Schema({
  // Vehicle Reference
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle reference is required']
  },
  
  // Document Identification
  documentType: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'insurance',
      'inspection_certificate', 
      'registration',
      'fitness_certificate',
      'road_license',
      'emission_test',
      'purchase_documents',
      'warranty',
      'service_manual',
      'other'
    ],
    default: 'insurance'
  },
  
  // Document Details
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  documentNumber: {
    type: String,
    required: [true, 'Document number is required'],
    trim: true
  },
  
  // Validity Period
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  
  // Provider/Issuer Information
  provider: {
    type: String,
    required: [true, 'Document provider is required'],
    trim: true
  },
  providerContact: {
    phone: String,
    email: String,
    address: String
  },
  
  // File Storage
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    min: 0
  },
  
  // Financial Information (for insurance, etc.)
  premium: {
    type: Number,
    min: [0, 'Premium cannot be negative']
  },
  coverage: {
    type: String,
    trim: true
  },
  
  // Status & Tracking
  status: {
    type: String,
    enum: ['active', 'expired', 'renewed', 'cancelled', 'pending'],
    default: 'active'
  },
  
  // Renewal Information
  renewalReminder: {
    type: Boolean,
    default: true
  },
  reminderDays: {
    type: Number,
    default: 30, // Days before expiry to send reminder
    min: [1, 'Reminder days must be at least 1'],
    max: [365, 'Reminder days cannot exceed 365']
  },
  
  // Verification
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
  },
  
  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }]

}, {
  timestamps: true
});

// Indexes for performance
vehicleDocumentSchema.index({ vehicle: 1, documentType: 1 });
vehicleDocumentSchema.index({ expiryDate: 1 });
vehicleDocumentSchema.index({ status: 1 });
vehicleDocumentSchema.index({ documentNumber: 1 });
vehicleDocumentSchema.index({ provider: 1 });

// Virtual for days until expiry
vehicleDocumentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for expiry status
vehicleDocumentSchema.virtual('expiryStatus').get(function() {
  const days = this.daysUntilExpiry;
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'valid';
});

// Virtual for requires renewal
vehicleDocumentSchema.virtual('requiresRenewal').get(function() {
  return this.daysUntilExpiry <= this.reminderDays;
});

// Pre-save middleware to update status based on expiry
vehicleDocumentSchema.pre('save', function(next) {
  if (this.expiryDate) {
    const today = new Date();
    if (new Date(this.expiryDate) < today && this.status !== 'renewed') {
      this.status = 'expired';
    }
  }
  next();
});

// Static method to find expiring documents
vehicleDocumentSchema.statics.getExpiringDocuments = function(days = 30) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);

  return this.find({
    expiryDate: { $lte: targetDate, $gte: new Date() },
    status: 'active'
  }).populate('vehicle', 'plateNumber make model');
};

// Static method to get expired documents
vehicleDocumentSchema.statics.getExpiredDocuments = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: { $in: ['active', 'pending'] }
  }).populate('vehicle', 'plateNumber make model');
};

// Static method to get document statistics
vehicleDocumentSchema.statics.getDocumentStats = function(vehicleId = null) {
  const matchStage = vehicleId ? { vehicle: vehicleId } : {};

  return this.aggregate([
    { $match: matchStage },
    { 
      $group: { 
        _id: '$documentType',
        count: { $sum: 1 },
        expiredCount: { 
          $sum: { 
            $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0] 
          } 
        },
        expiringCount: {
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
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Method to renew document
vehicleDocumentSchema.methods.renewDocument = function(newExpiryDate, newDocumentNumber = null) {
  // Create a copy of the current document as historical record
  const renewedDoc = this.toObject();
  delete renewedDoc._id;
  
  // Update current document
  if (newDocumentNumber) {
    this.documentNumber = newDocumentNumber;
  }
  this.expiryDate = newExpiryDate;
  this.status = 'renewed';
  this.verified = false;
  this.verifiedBy = null;
  this.verificationDate = null;
  
  return renewedDoc; // Return the old data for historical tracking
};

// Method to send renewal reminder
vehicleDocumentSchema.methods.shouldSendReminder = function() {
  return this.renewalReminder && 
         this.daysUntilExpiry <= this.reminderDays && 
         this.daysUntilExpiry > 0 &&
         this.status === 'active';
};

// Auto-populate related data
vehicleDocumentSchema.pre('find', function() {
  this.populate('vehicle', 'plateNumber make model')
       .populate('verifiedBy', 'firstName lastName');
});

vehicleDocumentSchema.pre('findOne', function() {
  this.populate('vehicle', 'plateNumber make model')
       .populate('verifiedBy', 'firstName lastName');
});

// Ensure virtual fields are serialized
vehicleDocumentSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('VehicleDocument', vehicleDocumentSchema);