const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/db'); // ← FIXED PATH

// Import middleware
const errorHandler = require('./src/middleware/errorHandler'); // ← FIXED PATH

// Import admin routes
const classroomRoutes = require('./src/routes/admin/classroomRoutes'); // ← FIXED PATH
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

// Import auth routes
const authRoutes = require('./src/routes/auth'); // ← FIXED PATH

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/classrooms', classroomRoutes);
app.use('/api/admin/students', studentRoutes);
app.use('/api/admin/parents', parentRoutes);
app.use('/api/admin/staff', staffRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/grades', gradeRoutes);
app.use('/api/admin/courses', courseRoutes);
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/curriculums', curriculumRoutes);
app.use('/api/admin/clubs', clubRoutes);
app.use('/api/admin/stakeholders', stakeholderRoutes);

// Home route
app.get('/', (req, res) => {
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

// 404 handler for undefined routes
app.use((req, res) => {
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
});
