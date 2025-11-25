const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  patron: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  description: {
    type: String
  },
  members: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    },
    joinedDate: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ["Member", "Leader", "Treasurer"],
      default: "Member"
    }
  }],
  activities: [{
    name: String,
    date: Date,
    description: String
  }],
  meetingSchedule: {
    day: String,
    time: String,
    location: String
  }
}, { 
  timestamps: true 
});

// Virtual for membersCount
clubSchema.virtual('membersCount').get(function() {
  return this.members.length;
});

// Auto-populate patron and members
clubSchema.pre('find', function() {
  this.populate('patron').populate('members.student');
});

module.exports = mongoose.model("Club", clubSchema);