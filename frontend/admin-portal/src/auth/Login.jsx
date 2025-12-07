import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { School } from 'lucide-react'
import { Button, Input, showToast } from '@shared'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      showToast.error('Please enter both email and password')
      return
    }
    
    setLoading(true)

    try {
      // Call the actual login function with email and password
      const result = await login(email, password)
      
      if (result.success) {
        showToast.success('Login successful!')
        navigate('/dashboard')
      } else {
        showToast.error('Login failed', result.error || 'Please check your credentials')
      }
    } catch (error) {
      showToast.error('Login failed', error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <School className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Scholalink Admin
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your admin account
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              type="email"
              required
              placeholder="admin@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            
            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              size="lg"
            >
              Sign in
            </Button>
          </form>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact support@scholalink.com</p>
        </div>
      </div>
    </div>
  )
}

export default Login