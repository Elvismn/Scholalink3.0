const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
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
  grade: { 
    type: String, 
    required: [true, "Grade level is required"] 
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom"
  },
  dateOfBirth: { 
    type: Date,
    required: [true, "Date of birth is required"]
  },
  gender: { 
    type: String, 
    enum: ["Male", "Female", "Other"],
    required: true
  },
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
    required: true
  }],
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

// REMOVE THIS AUTO-POPULATE LINE:
// studentSchema.pre('find', function() {
//   this.populate('parents').populate('classroom');
// });

studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

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

studentSchema.methods.isActive = function() {
  return this.status === "Active";
};

studentSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model("Student", studentSchema);