import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '@shared'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // Remove or simplify the navigation useEffect to prevent issues
  useEffect(() => {
    if (!loading) {
      const isLoginPage = location.pathname === '/login'
      
      // Only redirect if we're on login page and already logged in
      if (user && isLoginPage) {
        navigate('/dashboard', { replace: true })
      }
      // Don't auto-redirect from protected routes - let components handle it
    }
  }, [user, loading, location.pathname, navigate])

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      
      if (response.user) {
        setUser(response.user)
        return { success: true, data: response.user }
      }
      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' }
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}