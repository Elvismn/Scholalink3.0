const mongoose = require("mongoose"); 

const departmentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  head: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  description: { 
    type: String 
  },
  contactEmail: {
    type: String
  },
  budget: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Virtual for numberOfStaff
departmentSchema.virtual('numberOfStaff').get(function() {
  return mongoose.model('Staff').countDocuments({ department: this._id });
});

// Auto-populate head
departmentSchema.pre('find', function() {
  this.populate('head');
});

module.exports = mongoose.model("Department", departmentSchema);