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
    opener: { type: Number, min: 0, max: 100, default: 0 },
    midterm: { type: Number, min: 0, max: 100, default: 0 },
    final: { type: Number, min: 0, max: 100, default: 0 }
  },
  totalScore: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ["A", "B", "C", "D", "E", "F","Incomplete"],
    default: "Incomplete"
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  comments: {
    type: String
  }
}, {
  timestamps: true
});

// MONGOOSE 9.x COMPATIBLE PRE-SAVE MIDDLEWARE
gradeSchema.pre("save", function() {
  console.log('🔧 PRE-SAVE MIDDLEWARE TRIGGERED');
  console.log('📊 Scores:', this.scores);
  try {
    const scores = this.scores || {};
    const opener = scores.opener || 0;
    const midterm = scores.midterm || 0;
    const final = scores.final || 0;
    
    console.log('🧮 Calculating total score...');

    // Calculate total score with weights
    this.totalScore = (((opener) + (midterm) + (final)) / 3 );
    
    // Round to 2 decimal places for cleaner display
    this.totalScore = Math.round(this.totalScore * 100) / 100;

    console.log('📈 Total Score:', this.totalScore);

    // Determine grade
    if (this.totalScore >= 90) this.grade = "A";
    else if (this.totalScore >= 80) this.grade = "B";
    else if (this.totalScore >= 70) this.grade = "C";
    else if (this.totalScore >= 60) this.grade = "D";
    else this.grade = "F";

    console.log('🎓 Grade:', this.grade);
    
  } catch (error) {
    console.error('❌ Pre-save error:', error);
    throw error;
  }
});

// Indexes
gradeSchema.index({ student: 1, course: 1, academicYear: 1, term: 1 });
gradeSchema.index({ student: 1, published: 1 });

// Auto-populate
gradeSchema.pre('find', function() {
  this.populate('student').populate('course').populate('teacher');
});

gradeSchema.pre('findOne', function() {
  this.populate('student').populate('course').populate('teacher');
});

module.exports = mongoose.model("Grade", gradeSchema);