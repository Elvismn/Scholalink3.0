const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true
  },
  instructor: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true 
  },
  code: {
    type: String, 
    required: true, 
    unique: true 
  },
  description: { 
    type: String 
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  },
  credits: {
    type: Number,
    default: 1
  },
  syllabus: [{
    topic: String,
    duration: String
  }]
}, { 
  timestamps: true 
});

// Auto-populate instructor and department
courseSchema.pre('find', function() {
  this.populate('instructor').populate('department');
});

module.exports = mongoose.model("Course", courseSchema);