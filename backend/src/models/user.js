const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6
  },
  role: {
    type: String,
    enum: ["super_admin", "admin", "staff", "teacher", "parent"],
    required: true
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageStudents: { type: Boolean, default: false },
    canManageStaff: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set permissions based on role
userSchema.pre("save", function(next) {
  if (this.isModified("role")) {
    switch (this.role) {
      case "super_admin":
      case "admin":
        this.permissions = {
          canManageUsers: true,
          canManageStudents: true,
          canManageStaff: true,
          canManageInventory: true,
          canViewAnalytics: true
        };
        break;
      case "staff":
        this.permissions = {
          canManageUsers: false,
          canManageStudents: false,
          canManageStaff: false,
          canManageInventory: true,
          canViewAnalytics: false
        };
        break;
      case "teacher":
        this.permissions = {
          canManageUsers: false,
          canManageStudents: true,
          canManageStaff: false,
          canManageInventory: false,
          canViewAnalytics: false
        };
        break;
      case "parent":
        this.permissions = {
          canManageUsers: false,
          canManageStudents: false,
          canManageStaff: false,
          canManageInventory: false,
          canViewAnalytics: false
        };
        break;
    }
  }
  next();
});

module.exports = mongoose.model("User", userSchema);