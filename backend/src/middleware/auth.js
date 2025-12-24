const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Token is not valid or user is inactive.' 
      });
    }

    // ✅ FIXED: Update last login WITHOUT triggering pre-save hook
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          lastLogin: new Date()
        },
        $inc: {
          loginCount: 1
        }
      },
      { new: true }
    );

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid.' 
    });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

// Permission-based middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user?.permissions[permission]) {
      return res.status(403).json({ 
        success: false,
        error: `Insufficient permissions. Required: ${permission}` 
      });
    }
    next();
  };
};

module.exports = { auth, requireRole, requirePermission };