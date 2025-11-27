const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  // Basic Information
  firstName: { 
    type: String, 
    required: [true, "First name is required"],
    trim: true
  },
  lastName: { 
    type: String, 
    required: [true, "Last name is required"],
    trim: true
  },
  studentId: { 
    type: String, 
    required: [true, "Student ID is required"], 
    unique: true,
    trim: true
  },
  
  // Academic Information
  grade: { 
    type: String, 
    required: [true, "Grade level is required"] 
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom"
  },
  
  // Personal Information
  dateOfBirth: { 
    type: Date,
    required: [true, "Date of birth is required"]
  },
  gender: { 
    type: String, 
    enum: ["Male", "Female", "Other"],
    required: true
  },
  
  // Parent Relationships (Array for multiple parents/guardians)
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
    required: true
  }],
  
  // Contact & Emergency
  address: { 
    type: String 
  },
  emergencyContact: { 
    name: String,
    phone: String,
    relationship: String
  },
  medicalInfo: { 
    type: String 
  },
  
  // Enrollment Status
  enrollmentDate: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ["Active", "Inactive", "Transferred", "Graduated"], 
    default: "Active" 
  }
}, { 
  timestamps: true 
});

// ✅ FIXED: Remove duplicate indexes - only keep necessary ones
// studentSchema.index({ studentId: 1 }); // REMOVE - already unique
// studentSchema.index({ grade: 1 }); // REMOVE
// studentSchema.index({ status: 1 }); // REMOVE  
// studentSchema.index({ "parents": 1 }); // REMOVE

// Auto-populate parents and classroom for queries
studentSchema.pre('find', function() {
  this.populate('parents').populate('classroom');
});

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
studentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Method to check if student is active
studentSchema.methods.isActive = function() {
  return this.status === "Active";
};

// Ensure the virtual fields are included when converting to JSON
studentSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model("Student", studentSchema);