const mongoose = require("mongoose");

// Check if model already exists
if (mongoose.models.Parent) {
  module.exports = mongoose.models.Parent;
} else {
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

  module.exports = mongoose.model("Parent", parentSchema);
}