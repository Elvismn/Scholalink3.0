import { Bell, Search, User, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Header = ({ setMobileOpen }) => {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo on mobile (center) */}
          <div className="lg:hidden flex-1 text-center">
            <div className="inline-flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Scholalink</span>
            </div>
          </div>

          {/* Search - Hidden on mobile when logo is shown */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students, vehicles, staff..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-4">
            {/* Search icon for mobile */}
            <button className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {user?.name ? (
                    <span className="text-blue-600 font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrator'}
                  </div>
                </div>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <a 
                    href="#" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault()
                      // Handle profile click
                    }}
                  >
                    <User className="w-4 h-4" />
                    Your Profile
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault()
                      // Handle settings click
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </a>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile search bar (appears below header) */}
        <div className="lg:hidden py-3 border-t">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header