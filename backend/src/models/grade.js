const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ["Term 1", "Term 2", "Term 3"],
    required: true
  },
  scores: {
    assignments: { type: Number, min: 0, max: 100 },
    midterm: { type: Number, min: 0, max: 100 },
    final: { type: Number, min: 0, max: 100 },
    practical: { type: Number, min: 0, max: 100 }
  },
  totalScore: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ["A", "B", "C", "D", "F", "Incomplete"]
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  comments: {
    type: String
  },
  published: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate totalScore before saving
gradeSchema.pre("save", function(next) {
  const { assignments = 0, midterm = 0, final = 0, practical = 0 } = this.scores;
  
  // Customize weighting as needed
  this.totalScore = (assignments * 0.2) + (midterm * 0.3) + (final * 0.4) + (practical * 0.1);
  
  // Determine grade based on totalScore
  if (this.totalScore >= 90) this.grade = "A";
  else if (this.totalScore >= 80) this.grade = "B";
  else if (this.totalScore >= 70) this.grade = "C";
  else if (this.totalScore >= 60) this.grade = "D";
  else this.grade = "F";
  
  next();
});

// Index for faster queries
gradeSchema.index({ student: 1, course: 1, academicYear: 1, term: 1 });
gradeSchema.index({ student: 1, published: 1 });

// Auto-populate student, course, and teacher
gradeSchema.pre('find', function() {
  this.populate('student').populate('course').populate('teacher');
});

module.exports = mongoose.model("Grade", gradeSchema);