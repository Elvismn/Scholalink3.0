import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'sonner'
import Layout from './layouts/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Vehicles from './pages/Vehicles'
import Parents from './pages/Parents'
import Staff from './pages/Staff'
import Classes from './pages/Classes'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="parents" element={<Parents />} />
            <Route path="staff" element={<Staff />} />
            <Route path="classes" element={<Classes />} />
            {/* Add your other routes here */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App