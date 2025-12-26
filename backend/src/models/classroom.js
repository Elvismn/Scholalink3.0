const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  gradeLevel: { 
    type: String,
    required: true 
  },
  classTeacher: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  capacity: { 
    type: Number,
    required: true 
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  }],
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  }]
}, { 
  timestamps: true 
});

classroomSchema.virtual('numberOfStudents').get(function() {
  return this.students.length;
});

// REMOVE THIS AUTO-POPULATE LINE:
// classroomSchema.pre('find', function() {
//   this.populate('classTeacher').populate('students').populate('courses');
// });

module.exports = mongoose.model("Classroom", classroomSchema);