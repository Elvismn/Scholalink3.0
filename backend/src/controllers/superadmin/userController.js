const User = require('../../models/User');
const Staff = require('../../models/Staff');
const Parent = require('../../models/Parent');
const Student = require('../../models/Student');

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    const loginStats = await User.aggregate([
      { $match: { lastLogin: { $exists: true } } },
      { $sort: { lastLogin: -1 } },
      { $limit: 20 },
      { 
        $project: { 
          email: 1, 
          lastLogin: 1, 
          loginCount: 1, 
          role: 1,
          isActive: 1
        } 
      }
    ]);

    const recentRegistrations = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        roleDistribution: roleStats,
        recentLogins: loginStats,
        recentRegistrations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new admin (by super admin)
const createAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'admin' } = req.body;

    // Validate role
    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admin role'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create admin user
    const adminUser = await User.create({
      email,
      password,
      role,
      profile: { firstName, lastName, phone }
    });

    // Create staff profile
    await Staff.create({
      user: adminUser._id,
      firstName,
      lastName,
      phone,
      position: role === 'super_admin' ? 'System Administrator' : 'Administrator',
      employeeId: `ADM${Date.now()}`,
      department: 'Administration'
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: adminUser._id,
          email: adminUser.email,
          role: adminUser.role,
          profile: adminUser.profile
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // Prevent self-role modification
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Deactivate user
const deactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deactivation
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalStaff = await Staff.countDocuments();
    const totalParents = await Parent.countDocuments();
    
    const activeUsers = await User.countDocuments({ isActive: true });
    const recentLogins = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalStaff,
        totalParents,
        activeUsers,
        recentLogins
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserAnalytics,
  createAdmin,
  updateUserRole,
  deactivateUser,
  getSystemStats
};