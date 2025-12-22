const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  }],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  }
}, { 
  timestamps: true 
});

// Auto-populate user and children
parentSchema.pre('find', function() {
  this.populate('user').populate('children');
});

module.exports = mongoose.model("Parent", parentSchema);