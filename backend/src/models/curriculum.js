const mongoose = require("mongoose");   

const curriculumSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true
  },
  academicYear: { 
    type: String, 
    required: true
  },
  gradeLevel: {
    type: String,
    required: true
  },
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course"
    },
    hoursPerWeek: Number,
    syllabus: [String]
  }],
  description: { 
    type: String 
  },
  status: {
    type: String,
    enum: ["Draft", "Active", "Archived"],
    default: "Draft"
  }
}, { 
  timestamps: true 
});

// Auto-populate subjects
curriculumSchema.pre('find', function() {
  this.populate('subjects.subject');
});

module.exports = mongoose.model("Curriculum", curriculumSchema);