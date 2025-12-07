import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'sonner'
import Layout from './layouts/Layout'
import Login from './auth/Login'
import Dashboard from './dashboards/Dashboard'
import Students from './pages/Students'
import Vehicles from './pages/Vehicles'
import Parents from './pages/Parents'
import Staff from './pages/Staff'
import Classes from './pages/Classes'
import Grades from './pages/Grades'
import Courses from './pages/Courses'
import Departments from './pages/Departments'
import Inventory from './pages/Inventory'
import Users from './pages/Users'
import Curriculum from './pages/Curriculum'
import Clubs from './pages/Clubs'
import Stakeholders from './pages/Stakeholders'
import FuelRecords from './pages/FuelRecords'
import MaintenanceRecords from './pages/MaintenanceRecords'
import VehicleDocuments from './pages/VehicleDocuments'
import Settings from './dashboards/Settings'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public routes (no layout) */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with Layout */}
          <Route path="/" element={<Layout />}>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard route */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* All other pages under dashboard */}
            <Route path="dashboard/students" element={<Students />} />
            <Route path="dashboard/vehicles" element={<Vehicles />} />
            <Route path="dashboard/parents" element={<Parents />} />
            <Route path="dashboard/staff" element={<Staff />} />
            <Route path="dashboard/classes" element={<Classes />} />
            <Route path="dashboard/grades" element={<Grades />} />
            <Route path="dashboard/courses" element={<Courses />} />
            <Route path="dashboard/departments" element={<Departments />} />
            <Route path="dashboard/inventory" element={<Inventory />} />
            <Route path="dashboard/users" element={<Users />} />
            <Route path="dashboard/curriculum" element={<Curriculum />} />
            <Route path="dashboard/clubs" element={<Clubs />} />
            <Route path="dashboard/stakeholders" element={<Stakeholders />} />
            <Route path="dashboard/fuel-records" element={<FuelRecords />} />
            <Route path="dashboard/maintenance" element={<MaintenanceRecords />} />
            <Route path="dashboard/vehicle-documents" element={<VehicleDocuments />} />
            <Route path="dashboard/settings" element={<Settings />} />
            
            {/* 404 Route for protected area */}
            <Route path="*" element={
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
                  <a 
                    href="/dashboard" 
                    className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            } />
          </Route>
          
          {/* 404 for public routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App