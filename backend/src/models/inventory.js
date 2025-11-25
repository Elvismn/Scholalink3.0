const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemName: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ["Library", "Lab", "General", "Sports", "IT"], 
    required: true 
  },
  quantity: { 
    type: Number, 
    default: 1 
  },
  minQuantity: {
    type: Number,
    default: 5
  },
  condition: { 
    type: String, 
    enum: ["Excellent", "Good", "Fair", "Poor", "Needs Replacement"],
    default: "Good" 
  },
  location: {
    type: String,
    required: true
  },
  lastChecked: { 
    type: Date, 
    default: Date.now 
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  notes: {
    type: String
  }
}, { 
  timestamps: true 
});

// Auto-populate checkedBy
inventorySchema.pre('find', function() {
  this.populate('checkedBy');
});

module.exports = mongoose.model("Inventory", inventorySchema);