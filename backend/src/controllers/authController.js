const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Parent = require('../models/Parent');
const { getPermissionsForRole } = require('../utils/permissions');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register user (Parent only for public registration)
const register = async (req, res) => {
  try {
    console.log('🔧 Starting registration process');
    console.log('📦 Full request body:', req.body);

    // Validate req.body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is empty or invalid JSON'
      });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, firstName, lastName'
      });
    }

    console.log('🔧 Starting registration process for:', email);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email.'
      });
    }

    console.log('✅ Email is available, creating user...');

    // ✅ USE THE NEW STATIC METHOD INSTEAD OF User.create()
    const user = await User.createUser({
      email,
      password, // This will be hashed in the static method
      role: 'parent',
      profile: {
        firstName,
        lastName,
        phone: phone || ''
      }
    });

    console.log('✅ User created successfully with ID:', user._id);

    // CREATE PARENT PROFILE TOO!
    console.log('🔧 Creating parent profile...');
    const parent = await Parent.create({
      user: user._id,
      firstName,
      lastName,
      phone: phone || ''
    });

    console.log('✅ Parent profile created successfully with ID:', parent._id);

    const token = generateToken(user._id);
    console.log('✅ JWT token generated');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        permissions: getPermissionsForRole(user.role)
      }
    });

    console.log('🎉 Registration completed successfully for:', email);

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Login user (unchanged)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔧 Attempting login for:', email);

    // Check if user exists and is active
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      console.log('❌ Login failed: User not found or inactive');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or account inactive.'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.'
      });
    }

    const token = generateToken(user._id);
    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        permissions: getPermissionsForRole(user.role),
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get current user (unchanged)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        permissions: getPermissionsForRole(user.role),
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('❌ getMe error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = { register, login, getMe };