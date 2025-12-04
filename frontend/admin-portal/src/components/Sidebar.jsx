import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Car, 
  UserCircle, 
  Briefcase, 
  GraduationCap,
  BarChart,
  Settings,
  LogOut
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const { user, logout } = useAuth()

  const navItems = [
    { to: '/dashboard', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/students', icon: <Users className="w-5 h-5" />, label: 'Students' },
    { to: '/vehicles', icon: <Car className="w-5 h-5" />, label: 'Vehicles' },
    { to: '/parents', icon: <UserCircle className="w-5 h-5" />, label: 'Parents' },
    { to: '/staff', icon: <Briefcase className="w-5 h-5" />, label: 'Staff' },
    { to: '/classes', icon: <GraduationCap className="w-5 h-5" />, label: 'Classes' },
    { to: '/grades', icon: <BarChart className="w-5 h-5" />, label: 'Grades' },
  ]

  const getUserInitials = () => {
    if (!user?.name) return 'A'
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <div className="text-lg font-bold text-gray-900">Scholalink</div>
            <div className="text-xs text-gray-500">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
            end
          >
            {({ isActive }) => (
              <>
                <div className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        
        {/* Settings Section */}
        <div className="pt-6 mt-6 border-t border-gray-200">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            {({ isActive }) => (
              <>
                <Settings className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium">Settings</span>
              </>
            )}
          </NavLink>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
          >
            <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-600" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50/50">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">
              {getUserInitials()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrator'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar