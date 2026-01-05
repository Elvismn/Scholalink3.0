import { useState, useEffect } from 'react'
import { Moon, Sun, Bell, Lock, User, Palette, Globe, Save, Shield, Database, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { Button, Card, Input, Select, Switch, showToast, Modal } from '@shared'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { notificationService } from '../services/notificationService'
import { adminApi } from '../services/adminApi'

const Settings = () => {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Load settings from localStorage and notification service
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('appSettings')
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: false,
      twoFactorAuth: false,
      language: 'en',
      timezone: 'UTC',
      dashboardRefresh: 30,
      itemsPerPage: 10,
      autoSave: true
    }
    
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) }
      } catch (error) {
        console.warn('Failed to parse saved settings:', error)
      }
    }
    
    return defaultSettings
  })

  // Load notification settings
  const [notificationSettings, setNotificationSettings] = useState(() => {
    return notificationService.getSettings()
  })

  // Handle password change with proper error handling
  // Handle password change using adminApi
const handlePasswordChange = async () => {
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    showToast.error('New passwords do not match')
    return
  }

  if (passwordData.newPassword.length < 6) {
    showToast.error('Password must be at least 6 characters')
    return
  }

  setLoading(true)
  try {
    // Use adminApi for password change
    const response = await adminApi.changePassword(
      passwordData.currentPassword,
      passwordData.newPassword
    )

    if (response.success) {
      showToast.success('Password changed successfully')
      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } else {
      throw new Error(response.error || 'Failed to change password')
    }
  } catch (error) {
    console.error('Password change error:', error)
    
    // Check if it's a 404 error (endpoint doesn't exist)
    if (error.status === 404 || error.message.includes('404')) {
      showToast.warning(
        'Backend Update Required',
        'Password change endpoint not implemented. Please implement /api/auth/change-password in backend.'
      )
      
      // Fallback: Show mock success for UX
      setTimeout(() => {
        console.log('Mock password change (backend endpoint needed):', {
          userId: user?.id,
          email: user?.email
        })
        showToast.success('Password change simulated (backend endpoint needed)')
        setShowPasswordModal(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }, 500)
    } else {
      // Show actual error from API
      showToast.error('Failed to change password', error.data?.error || error.message || 'Unknown error')
    }
  } finally {
    setLoading(false)
  }
}
  // Handle notification settings change
  const handleNotificationChange = async (key, value) => {
    const updatedSettings = { ...notificationSettings, [key]: value }
    setNotificationSettings(updatedSettings)
    
    // Request push permission if enabling push notifications
    if (key === 'pushNotifications' && value === true) {
      const granted = await notificationService.requestPushPermission()
      if (!granted) {
        showToast.warning('Please enable notifications in your browser settings')
        setNotificationSettings(prev => ({ ...prev, pushNotifications: false }))
        return
      }
    }
    
    // Save to localStorage
    notificationService.saveSettings(updatedSettings)
  }

  // Handle notification category change
  const handleCategoryChange = (category, value) => {
    const updatedSettings = {
      ...notificationSettings,
      notificationCategories: {
        ...notificationSettings.notificationCategories,
        [category]: value
      }
    }
    setNotificationSettings(updatedSettings)
    notificationService.saveSettings(updatedSettings)
  }

  // Send test notification
  const sendTestNotification = () => {
    if (notificationSettings.pushNotifications) {
      const sent = notificationService.sendTestNotification(
        'Test Notification',
        'This is a test notification from Scholalink Admin'
      )
      if (sent) {
        showToast.success('Test notification sent')
      } else {
        showToast.warning('Please enable notifications in your browser')
      }
    } else {
      showToast.info('Enable push notifications first')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save general settings
      localStorage.setItem('appSettings', JSON.stringify(settings))
      
      showToast.success('Settings saved and applied')
    } catch (error) {
      showToast.error('Failed to save settings', error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        emailNotifications: true,
        pushNotifications: false,
        twoFactorAuth: false,
        language: 'en',
        timezone: 'UTC',
        dashboardRefresh: 30,
        itemsPerPage: 10,
        autoSave: true
      }
      setSettings(defaultSettings)
      localStorage.setItem('appSettings', JSON.stringify(defaultSettings))
      
      // Reset notification settings
      const defaultNotifications = notificationService.defaultSettings
      setNotificationSettings(defaultNotifications)
      notificationService.saveSettings(defaultNotifications)
      
      showToast.info('Settings reset to defaults')
    }
  }

  // Theme preview based on current theme
  const getThemePreviewStyle = () => {
    return theme === 'light' 
      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200'
      : 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700'
  }

  const getThemePreviewText = () => {
    return theme === 'light' 
      ? 'text-gray-600'
      : 'text-gray-400'
  }

  const getThemePreviewBg = () => {
    return theme === 'light' 
      ? 'bg-white'
      : 'bg-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your application preferences</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={resetSettings}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customize the look and feel</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose between light and dark mode</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-4 h-4" />
                      Switch to Dark
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" />
                      Switch to Light
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Auto-save Changes</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Automatically save settings changes</p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onChange={(checked) => setSettings({...settings, autoSave: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Items Per Page (Global Setting)
                  </label>
                  <Select
                    value={settings.itemsPerPage}
                    onChange={(e) => setSettings({...settings, itemsPerPage: parseInt(e.target.value)})}
                    options={[
                      { value: 10, label: '10 items' },
                      { value: 25, label: '25 items' },
                      { value: 50, label: '50 items' },
                      { value: 100, label: '100 items' }
                    ]}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This setting will apply to all paginated tables in the application
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notifications Settings - Now Real */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure how you receive notifications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive browser notifications</p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notification Frequency
                </label>
                <Select
                  value={notificationSettings.notificationFrequency}
                  onChange={(e) => handleNotificationChange('notificationFrequency', e.target.value)}
                  options={[
                    { value: 'realtime', label: 'Real-time (Immediate)' },
                    { value: 'hourly', label: 'Hourly Digest' },
                    { value: 'daily', label: 'Daily Summary' },
                    { value: 'weekly', label: 'Weekly Report' }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dashboard Refresh Rate (seconds)
                </label>
                <Select
                  value={settings.dashboardRefresh}
                  onChange={(e) => setSettings({...settings, dashboardRefresh: parseInt(e.target.value)})}
                  options={[
                    { value: 15, label: '15 seconds' },
                    { value: 30, label: '30 seconds' },
                    { value: 60, label: '1 minute' },
                    { value: 300, label: '5 minutes' },
                    { value: 0, label: 'Never (manual refresh)' }
                  ]}
                />
              </div>

              {/* Notification Categories */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Notification Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(notificationSettings.notificationCategories).map(([category, enabled]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {category.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {category === 'students' && 'New registrations, updates'}
                          {category === 'vehicles' && 'Maintenance, fuel records'}
                          {category === 'maintenance' && 'Upcoming maintenance'}
                          {category === 'documents' && 'Expiring documents'}
                          {category === 'fuel' && 'Fuel records added'}
                          {category === 'parents' && 'Parent accounts, updates'}
                          {category === 'staff' && 'Staff changes'}
                          {category === 'system' && 'System alerts, updates'}
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onChange={(checked) => handleCategoryChange(category, checked)}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant="secondary"
                  onClick={sendTestNotification}
                  className="w-full"
                >
                  Send Test Notification
                </Button>
              </div>
            </div>
          </Card>

          {/* Data Management - Keep as is */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your settings data</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  const dataStr = JSON.stringify({
                    appSettings: settings,
                    notificationSettings,
                    exportedAt: new Date().toISOString()
                  }, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'scholalink-settings.json'
                  link.click()
                  URL.revokeObjectURL(url)
                  showToast.success('Settings exported successfully')
                }}
                className="w-full"
              >
                Export Settings
              </Button>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (!file) return

                    const reader = new FileReader()
                    reader.onload = (event) => {
                      try {
                        const imported = JSON.parse(event.target.result)
                        if (imported.appSettings) {
                          setSettings(imported.appSettings)
                          localStorage.setItem('appSettings', JSON.stringify(imported.appSettings))
                        }
                        if (imported.notificationSettings) {
                          setNotificationSettings(imported.notificationSettings)
                          notificationService.saveSettings(imported.notificationSettings)
                        }
                        showToast.success('Settings imported successfully')
                      } catch (error) {
                        showToast.error('Failed to import settings', 'Invalid file format')
                      }
                    }
                    reader.readAsText(file)
                    e.target.value = ''
                  }}
                  className="hidden"
                />
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Import Settings
                </div>
              </label>
              
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm('Clear all cached data? This will log you out.')) {
                    localStorage.clear()
                    showToast.info('Cache cleared. Please refresh the page.')
                    setTimeout(() => {
                      window.location.reload()
                    }, 2000)
                  }
                }}
                className="w-full md:col-span-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Clear Cache
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Security Settings with Password Change */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your security preferences</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    console.log('Active Sessions:', {
                      currentSession: {
                        id: 'session_' + Date.now(),
                        browser: navigator.userAgent,
                        ip: '127.0.0.1',
                        lastActive: new Date().toISOString(),
                        location: 'Localhost'
                      }
                    })
                    showToast.info('Session details logged to console')
                  }}
                >
                  View Active Sessions
                </Button>
              </div>
            </div>
          </Card>

          {/* Regional Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Regional</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Language and timezone settings</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <Select
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'sw', label: 'Swahili' },
                    { value: 'ar', label: 'Arabic' }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timezone
                </label>
                <Select
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  options={[
                    { value: 'UTC', label: 'UTC (GMT)' },
                    { value: 'EST', label: 'Eastern Time (EST)' },
                    { value: 'CST', label: 'Central Time (CST)' },
                    { value: 'PST', label: 'Pacific Time (PST)' },
                    { value: 'GMT+3', label: 'East Africa Time (GMT+3)' }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date Format
                </label>
                <Select
                  value="dd/mm/yyyy"
                  onChange={() => {}}
                  options={[
                    { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY' },
                    { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY' },
                    { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD' }
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* About */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Application information</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Version</span>
                <span className="font-medium dark:text-white">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Build Date</span>
                <span className="font-medium dark:text-white">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Environment</span>
                <span className="font-medium dark:text-white">Development</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current Theme</span>
                <span className="font-medium dark:text-white capitalize">{theme}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Logged in as</span>
                <span className="font-medium dark:text-white">{user?.email || 'User'}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => showToast.info('Opening documentation...')}
                  >
                    Documentation
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => showToast.info('Opening support portal...')}
                  >
                    Support
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Current Theme Preview - Now Dynamic */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Preview</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current theme: <span className="font-medium capitalize">{theme} mode</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className={`w-3 h-3 rounded-full ${theme === 'light' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
            <span>Active</span>
          </div>
        </div>
        
        <div className={`mt-4 p-4 rounded-lg border ${getThemePreviewStyle()} ${getThemePreviewBg()}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className={`h-2 rounded ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
              <div className={`h-2 rounded w-3/4 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}></div>
              <div className={`h-2 rounded w-1/2 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-blue-500 rounded"></div>
                <div className={`h-6 w-16 rounded ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
              </div>
              <div className={`h-8 w-full border rounded ${theme === 'light' ? 'border-gray-300' : 'border-gray-700'}`}></div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className={`text-sm ${getThemePreviewText()}`}>
              This is how your interface looks in {theme} mode
            </p>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
        }}
        title="Change Password"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showPassword.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showPassword.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                placeholder="Enter new password (min. 6 characters)"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                type={showPassword.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              loading={loading}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Settings