const mongoose = require("mongoose");

const stakeholderSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["Distributor", "Collaborator", "Wellwisher", "Sponsor", "Partner"], 
    required: true 
  },
  contact: { 
    type: String 
  },
  email: { 
    type: String 
  },
  organization: {
    type: String
  },
  contribution: { 
    type: String 
  },
  relationshipStart: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Pending"],
    default: "Active"
  },
  notes: {
    type: String
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model("Stakeholder", stakeholderSchema);