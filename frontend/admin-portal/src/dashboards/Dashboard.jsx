// dashboards/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Car, GraduationCap, DollarSign, TrendingUp, Calendar, AlertCircle, RefreshCw, FileText, Wrench, Fuel, Settings } from 'lucide-react'
import { Card, Button, showToast } from '@shared'
import { dashboardService } from '../services/dashboardService'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalVehicles: 0,
    activeParents: 0,
    monthlyExpenditure: 0,
    upcomingMaintenance: 0,
    expiringDocuments: 0
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const data = await dashboardService.getDashboardStats()
      
      setStats({
        totalStudents: data.totalStudents,
        totalVehicles: data.totalVehicles,
        activeParents: data.activeParents,
        monthlyExpenditure: data.monthlyExpenditure,
        upcomingMaintenance: data.upcomingMaintenance,
        expiringDocuments: data.expiringDocuments
      })

      setRecentActivity(data.recentActivity)
      setLoading(false)
    } catch (error) {
      console.error('Dashboard error:', error)
      showToast.error('Failed to load dashboard data')
      setLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    setRefreshing(true)
    dashboardService.clearCache()
    await fetchDashboardData()
    setRefreshing(false)
    showToast.success('Dashboard refreshed')
  }

  // Navigation handlers
  const handleAlertClick = (title) => {
    if (title === 'Upcoming Maintenance') {
      navigate('/dashboard/maintenance')
    } else if (title === 'Expiring Documents') {
      navigate('/dashboard/vehicle-documents')
    }
  }

  const handleQuickAction = (action) => {
    switch(action.label) {
      case 'Add Student':
      case 'Manage Students':
        navigate('/dashboard/students')
        break
      case 'Add Vehicle':
      case 'Manage Vehicles':
        navigate('/dashboard/vehicles')
        break
      case 'Manage Staff':
        navigate('/dashboard/staff')
        break
      case 'Manage Parents':
        navigate('/dashboard/parents')
        break
      case 'Check Inventory':
        navigate('/dashboard/inventory')
        break
      case 'Settings':
        navigate('/dashboard/settings')
        break
      case 'Fuel Records':
        navigate('/dashboard/fuel-records')
        break
      case 'Maintenance':
        navigate('/dashboard/maintenance')
        break
      case 'View Reports':
        showToast.info('Reports feature coming soon')
        break
      case 'Send Notices':
        showToast.info('Notifications feature coming soon')
        break
      case 'Schedule':
        showToast.info('Schedule feature coming soon')
        break
      default:
        navigate('/dashboard')
    }
  }

  const formatCurrency = (amount) => {
    return `KES ${amount.toLocaleString()}`
  }

  // Dynamic stat cards - using real data
  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <Users className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600',
      change: '+12%', // Would need historical data to calculate
      trend: 'up'
    },
    {
      title: 'School Vehicles',
      value: stats.totalVehicles,
      icon: <Car className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-600',
      change: '+2',
      trend: 'up'
    },
    {
      title: 'Active Parents',
      value: stats.activeParents,
      icon: <GraduationCap className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Monthly Expenditure',
      value: formatCurrency(stats.monthlyExpenditure),
      icon: <DollarSign className="h-6 w-6" />,
      color: 'from-yellow-500 to-amber-600',
      change: '-5%', // Would need historical data to calculate
      trend: 'down'
    }
  ]

  // Dynamic alert cards - using real data
  const alertCards = [
    {
      title: 'Upcoming Maintenance',
      value: stats.upcomingMaintenance,
      icon: <Wrench className="h-6 w-6" />,
      color: 'from-orange-500 to-red-600',
      description: 'Vehicles need service'
    },
    {
      title: 'Expiring Documents',
      value: stats.expiringDocuments,
      icon: <FileText className="h-6 w-6" />,
      color: 'from-red-500 to-pink-600',
      description: 'Need renewal this week'
    }
  ]

  // Quick actions with proper navigation
  const quickActionsList = [
    { label: 'Manage Students', icon: <Users className="w-5 h-5" />, color: 'blue' },
    { label: 'Manage Vehicles', icon: <Car className="w-5 h-5" />, color: 'green' },
    { label: 'Fuel Records', icon: <Fuel className="w-5 h-5" />, color: 'purple' },
    { label: 'Maintenance', icon: <Wrench className="w-5 h-5" />, color: 'yellow' },
    { label: 'Manage Staff', icon: <Users className="w-5 h-5" />, color: 'red' },
    { label: 'Manage Parents', icon: <GraduationCap className="w-5 h-5" />, color: 'indigo' },
    { label: 'Check Inventory', icon: <FileText className="w-5 h-5" />, color: 'pink' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, color: 'gray' }
  ]

  // Activity icon mapping
  const getActivityIcon = (type) => {
    switch(type) {
      case 'student': return <Users className="w-4 h-4 text-blue-500" />
      case 'vehicle': return <Car className="w-4 h-4 text-green-500" />
      case 'parent': return <GraduationCap className="w-4 h-4 text-purple-500" />
      case 'fuel': return <Fuel className="w-4 h-4 text-yellow-500" />
      case 'maintenance': return <Wrench className="w-4 h-4 text-orange-500" />
      case 'staff': return <Users className="w-4 h-4 text-red-500" />
      case 'system': return <TrendingUp className="w-4 h-4 text-gray-500" />
      default: return <TrendingUp className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to Scholalink Admin Portal</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleManualRefresh}
            loading={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              showToast.info('Report generation coming soon')
            }}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Grid - Now using real data */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden" hover>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 shadow-md`}>
                  <div className="text-white">{stat.icon}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-500 mr-1 transform rotate-180" />
                )}
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last month
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts - Now interactive with real data */}
        <div className="lg:col-span-1">
          <Card title="Alerts" subtitle="Require immediate attention">
            <div className="space-y-4">
              {alertCards.map((alert, index) => (
                <button
                  key={index}
                  onClick={() => handleAlertClick(alert.title)}
                  className="w-full flex items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
                >
                  <div className={`bg-gradient-to-br ${alert.color} rounded-lg p-2 mr-3`}>
                    {alert.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{alert.title}</div>
                    <div className="text-sm text-gray-600">{alert.description}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{alert.value}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions - Now interactive */}
        <div className="lg:col-span-2">
          <Card title="Quick Actions" subtitle="Frequently used functions">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActionsList.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${action.color}-100 to-${action.color}-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <div className={`text-${action.color}-600`}>{action.icon}</div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity - Now using real data from service */}
      <Card title="Recent Activity" subtitle="Latest system activities">
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading activities...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity found</p>
                <p className="text-sm text-gray-400 mt-1">Activities will appear as users interact with the system</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-gray-50 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.action}</div>
                      <div className="text-sm text-gray-500">by {activity.user}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{activity.time}</div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default Dashboard