const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  employeeId: {
    type: String,
    unique: true,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  salary: Number,
  qualifications: [String],
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  }]
}, { 
  timestamps: true 
});

// Auto-populate user and department
staffSchema.pre('find', function() {
  this.populate('user').populate('department').populate('subjects');
});

module.exports = mongoose.model("Staff", staffSchema);