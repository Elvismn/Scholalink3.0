import { useState, useEffect } from 'react'
import { Moon, Sun, Bell, Lock, User, Palette, Globe, Save, Shield, Database, RefreshCw } from 'lucide-react'
import { Button, Card, Input, Select, Switch, showToast } from '@shared'
import { useTheme } from '../context/ThemeContext'

const Settings = () => {
  const { theme, toggleTheme } = useTheme()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    twoFactorAuth: false,
    language: 'en',
    timezone: 'UTC',
    dashboardRefresh: 30,
    itemsPerPage: 10,
    autoSave: true
  })
  const [loading, setLoading] = useState(false)

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.warn('Failed to parse saved settings:', error)
      }
    }
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save settings to localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings))
      
      // Apply any immediate settings changes
      if (settings.autoSave) {
        showToast.success('Settings saved and applied')
      } else {
        showToast.success('Settings saved')
      }
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
        pushNotifications: true,
        twoFactorAuth: false,
        language: 'en',
        timezone: 'UTC',
        dashboardRefresh: 30,
        itemsPerPage: 10,
        autoSave: true
      }
      setSettings(defaultSettings)
      localStorage.setItem('appSettings', JSON.stringify(defaultSettings))
      showToast.info('Settings reset to defaults')
    }
  }

  const clearCache = () => {
    if (window.confirm('Clear all cached data? This will log you out.')) {
      localStorage.clear()
      showToast.info('Cache cleared. Please refresh the page.')
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'scholalink-settings.json'
    link.click()
    URL.revokeObjectURL(url)
    showToast.success('Settings exported successfully')
  }

  const importSettings = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedSettings = JSON.parse(event.target.result)
        setSettings(importedSettings)
        showToast.success('Settings imported successfully')
      } catch (error) {
        showToast.error('Failed to import settings', 'Invalid file format')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset file input
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
        {/* Appearance Settings */}
        <div className="lg:col-span-2 space-y-6">
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
                    Items Per Page
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
                </div>
              </div>
            </div>
          </Card>

          {/* Notifications Settings */}
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
                  checked={settings.emailNotifications}
                  onChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive browser notifications</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(checked) => setSettings({...settings, pushNotifications: checked})}
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
            </div>
          </Card>

          {/* Data Management */}
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
                onClick={exportSettings}
                className="w-full"
              >
                Export Settings
              </Button>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                />
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Import Settings
                </div>
              </label>
              
              <Button
                variant="secondary"
                onClick={clearCache}
                className="w-full md:col-span-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Clear Cache
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Security Settings */}
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
                  onClick={() => showToast.info('Password reset email sent')}
                >
                  Change Password
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => showToast.info('Session details shown in console')}
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

      {/* Current Theme Preview */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Preview</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current theme: <span className="font-medium capitalize">{theme} mode</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className={`w-3 h-3 rounded-full ${theme === 'light' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
            <span>Active</span>
          </div>
        </div>
        
        <div className="mt-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-blue-500 rounded"></div>
                <div className="h-6 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-8 w-full border border-gray-300 dark:border-gray-700 rounded"></div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is how your interface looks in {theme} mode
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Settings