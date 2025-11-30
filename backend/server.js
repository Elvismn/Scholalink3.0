const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');

// Import admin routes
const classroomRoutes = require('./src/routes/admin/classroomRoutes');
const studentRoutes = require('./src/routes/admin/studentRoutes');
const parentRoutes = require('./src/routes/admin/parentRoutes');
const staffRoutes = require('./src/routes/admin/staffRoutes');
const userRoutes = require('./src/routes/admin/userRoutes');
const gradeRoutes = require('./src/routes/admin/gradeRoutes');
const courseRoutes = require('./src/routes/admin/courseRoutes');
const departmentRoutes = require('./src/routes/admin/departmentRoutes');
const inventoryRoutes = require('./src/routes/admin/inventoryRoutes');
const curriculumRoutes = require('./src/routes/admin/curriculumRoutes');
const clubRoutes = require('./src/routes/admin/clubRoutes');
const stakeholderRoutes = require('./src/routes/admin/stakeholderRoutes');
const superAdminUserRoutes = require('./src/routes/superadmin/userRoutes');
const parentProfileRoutes = require('./src/routes/parents/profileRoutes');
const parentChildrenRoutes = require('./src/routes/parents/childrenRoutes');
const parentAcademicRoutes = require('./src/routes/parents/academicRoutes');
const vehicleRoutes = require('./src/routes/admin/vehicleRoutes');
const fuelRecordRoutes = require('./src/routes/admin/fuelRecordRoutes');
const maintenanceRoutes = require('./src/routes/admin/maintenanceRoutes');
const vehicleDocumentRoutes = require('./src/routes/admin/vehicleDocumentRoutes');

// Import auth routes
const authRoutes = require('./src/routes/auth');
const { auth, requireRole } = require('./src/middleware/auth');

// Connect to database
connectDB();  

const app = express();

// ✅✅✅ ENHANCED BODY PARSING WITH DEBUGGING ✅✅✅
app.use((req, res, next) => {
  console.log('🔧 RAW REQUEST - Content-Type:', req.headers['content-type']);
  console.log('🔧 RAW REQUEST - Content-Length:', req.headers['content-length']);
  next();
});

// Body parsing with increased limits and better error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.log('❌ JSON parsing error:', e.message);
      throw new Error('Invalid JSON');
    }
  }
}));

// TEMPORARY TEST ROUTE - Add this after body parsing middleware
app.post('/api/test-body', (req, res) => {
  console.log('🧪 TEST ROUTE - Raw request headers:', req.headers);
  console.log('🧪 TEST ROUTE - Request body:', req.body);
  console.log('🧪 TEST ROUTE - Body type:', typeof req.body);
  
  res.json({
    success: true,
    message: 'Test route response',
    bodyReceived: req.body,
    bodyType: typeof req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    }
  });
});

// TEMPORARY TEST ROUTE - Add this after body parsing middleware
app.put('/api/parent/test-profile', auth, requireRole(['parent']), (req, res) => {
  console.log('✅ Parent test route hit!');
  res.json({
    success: true,
    message: 'Parent route is working!',
    user: req.user
  });
});


app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ ENHANCED REQUEST LOGGING MIDDLEWARE
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  console.log('📦 Request Body:', req.body);
  console.log('📋 Request Headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? '***' : 'none'
  });
  next();
});

// ✅ ADD ROUTE LOADING LOGS
console.log('🔄 Loading routes...');

// Routes
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes loaded: /api/auth');

app.use('/api/admin/classrooms', classroomRoutes);
console.log('✅ Classroom routes loaded: /api/admin/classrooms');

app.use('/api/admin/students', studentRoutes);
console.log('✅ Student routes loaded: /api/admin/students');

app.use('/api/admin/parents', parentRoutes);
console.log('✅ Parent routes loaded: /api/admin/parents');

app.use('/api/admin/staff', staffRoutes);
console.log('✅ Staff routes loaded: /api/admin/staff');

app.use('/api/admin/users', userRoutes);
console.log('✅ User routes loaded: /api/admin/users');

app.use('/api/admin/grades', gradeRoutes);
console.log('✅ Grade routes loaded: /api/admin/grades');

app.use('/api/admin/courses', courseRoutes);
console.log('✅ Course routes loaded: /api/admin/courses');

app.use('/api/admin/departments', departmentRoutes);
console.log('✅ Department routes loaded: /api/admin/departments');

app.use('/api/admin/inventory', inventoryRoutes);
console.log('✅ Inventory routes loaded: /api/admin/inventory');

app.use('/api/admin/curriculums', curriculumRoutes);
console.log('✅ Curriculum routes loaded: /api/admin/curriculums');

app.use('/api/admin/clubs', clubRoutes);
console.log('✅ Club routes loaded: /api/admin/clubs');

app.use('/api/admin/stakeholders', stakeholderRoutes);
console.log('✅ Stakeholder routes loaded: /api/admin/stakeholders');

app.use('/api/super-admin/users', superAdminUserRoutes);
console.log('✅ Super Admin routes loaded: /api/super-admin/users');

app.use('/api/parents/', parentProfileRoutes);
console.log('✅ Parent Profile routes loaded: /api/parents/');

app.use('/api/parents/', parentChildrenRoutes);
console.log('✅ Parent children routes loaded: /api/parents/children');

app.use('/api/parents/', parentAcademicRoutes);
console.log('✅ Parent academic routes loaded: /api/parents/children/:childId');

app.use('/api/admin/vehicles', vehicleRoutes);
console.log('✅ Vehicle routes loaded: /api/admin/vehicles');

app.use('/api/admin/fuel-records', fuelRecordRoutes);
console.log('✅ Fuel record routes loaded: /api/admin/fuel-records');

app.use('/api/admin/maintenance', maintenanceRoutes);
console.log('✅ Maintenance routes loaded: /api/admin/maintenance');

app.use('/api/admin/vehicle-documents', vehicleDocumentRoutes);
console.log('✅ Vehicle document routes loaded: /api/admin/vehicle-documents');

console.log('🎯 All routes loaded successfully!');

// Home route
app.get('/', (req, res) => {
  console.log('🏠 Home route hit');
  res.json({
    success: true,
    message: 'School Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: {
        classrooms: '/api/admin/classrooms',
        students: '/api/admin/students',
        parents: '/api/admin/parents',
        staff: '/api/admin/staff',
        users: '/api/admin/users',
        grades: '/api/admin/grades',
        courses: '/api/admin/courses',
        departments: '/api/admin/departments',
        inventory: '/api/admin/inventory',
        curriculums: '/api/admin/curriculums',
        clubs: '/api/admin/clubs',
        stakeholders: '/api/admin/stakeholders'
      }
    }
  });
});

// Add a generic /api/admin route for info
app.get('/api/admin', (req, res) => {
  console.log('👨‍💼 Admin base route hit');
  res.json({
    success: true,
    message: 'Admin Portal API',
    availableEndpoints: {
      classrooms: '/api/admin/classrooms',
      students: '/api/admin/students',
      parents: '/api/admin/parents',
      staff: '/api/admin/staff',
      users: '/api/admin/users',
      grades: '/api/admin/grades',
      courses: '/api/admin/courses',
      departments: '/api/admin/departments',
      inventory: '/api/admin/inventory',
      curriculums: '/api/admin/curriculums',
      clubs: '/api/admin/clubs',
      stakeholders: '/api/admin/stakeholders'
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👨‍💼 Admin endpoints: http://localhost:${PORT}/api/admin`);
  console.log(`🏠 Home: http://localhost:${PORT}/`);
});

// Export the app for testing
module.exports = app;