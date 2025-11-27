const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use absolute paths for models
const User = require(path.join(__dirname, '../src/models/User'));
const Staff = require(path.join(__dirname, '../src/models/Staff'));
const Department = require(path.join(__dirname, '../src/models/Department'));

const createSuperAdmin = async () => {
  try {
    console.log('🔧 Starting Super Admin creation...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to database');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      console.log('❌ Super Admin already exists:', existingAdmin.email);
      return;
    }

    // ✅ FIX 1: Manually hash password since pre-save hook doesn't run in scripts
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('superadmin123', salt);

    // Create super admin user
    const superAdmin = await User.create({
      email: 'superadmin@school.com',
      password: hashedPassword, // ✅ Use pre-hashed password
      role: 'super_admin',
      profile: {
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+1234567890'
      }
    });

    console.log('✅ Super Admin User created:', superAdmin._id);

    // ✅ FIX 2: Handle department properly
    // Try to find an existing Administration department or create one
    let adminDepartment = await Department.findOne({ name: 'Administration' });
    
    if (!adminDepartment) {
      // Create Administration department if it doesn't exist
      adminDepartment = await Department.create({
        name: 'Administration',
        description: 'System Administration Department'
      });
      console.log('✅ Created Administration department');
    }

    // Create staff profile for super admin
    await Staff.create({
      user: superAdmin._id,
      firstName: 'Super',
      lastName: 'Admin',
      position: 'System Administrator',
      employeeId: 'SA001',
      department: adminDepartment._id // ✅ Use ObjectId, not string
    });

    console.log('✅ Super Admin Staff profile created');
    console.log('🎉 Super Admin setup completed!');
    console.log('══════════════════════════════════════');
    console.log('📧 Login: superadmin@school.com');
    console.log('🔑 Password: superadmin123');
    console.log('⚠️  Change password after first login!');
    console.log('══════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    console.error('🔍 Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Database connection closed');
  }
};

createSuperAdmin();