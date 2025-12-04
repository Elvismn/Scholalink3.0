import { useState, useEffect } from 'react'
import { Users, Car, GraduationCap, DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { Card, Button, showToast } from '@shared'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalVehicles: 0,
    activeParents: 0,
    monthlyRevenue: 0,
    upcomingMaintenance: 0,
    expiringDocuments: 0
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Mock data for now
      setTimeout(() => {
        setStats({
          totalStudents: 245,
          totalVehicles: 8,
          activeParents: 189,
          monthlyRevenue: 1250000,
          upcomingMaintenance: 3,
          expiringDocuments: 2
        })

        setRecentActivity([
          { id: 1, action: 'New student registered', time: '10 minutes ago', user: 'John Doe', type: 'student' },
          { id: 2, action: 'Vehicle maintenance recorded', time: '1 hour ago', user: 'Sarah Smith', type: 'vehicle' },
          { id: 3, action: 'Parent account created', time: '2 hours ago', user: 'Mike Johnson', type: 'parent' },
          { id: 4, action: 'Monthly report generated', time: '3 hours ago', user: 'System', type: 'system' },
          { id: 5, action: 'Staff attendance recorded', time: '4 hours ago', user: 'Lisa Brown', type: 'staff' }
        ])
        setLoading(false)
      }, 800)
    } catch (error) {
      showToast.error('Failed to load dashboard data')
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <Users className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
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
      title: 'Monthly Revenue',
      value: `KES ${stats.monthlyRevenue.toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6" />,
      color: 'from-yellow-500 to-amber-600',
      change: '+15%',
      trend: 'up'
    }
  ]

  const alertCards = [
    {
      title: 'Upcoming Maintenance',
      value: stats.upcomingMaintenance,
      icon: <AlertCircle className="h-6 w-6" />,
      color: 'from-orange-500 to-red-600',
      description: 'Vehicles need service'
    },
    {
      title: 'Expiring Documents',
      value: stats.expiringDocuments,
      icon: <Calendar className="h-6 w-6" />,
      color: 'from-red-500 to-pink-600',
      description: 'Need renewal this week'
    }
  ]

  const getActivityIcon = (type) => {
    switch(type) {
      case 'student': return <Users className="w-4 h-4 text-blue-500" />
      case 'vehicle': return <Car className="w-4 h-4 text-green-500" />
      case 'parent': return <GraduationCap className="w-4 h-4 text-purple-500" />
      case 'staff': return <Users className="w-4 h-4 text-yellow-500" />
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
          <Button variant="secondary" size="sm">
            Generate Report
          </Button>
          <Button size="sm">
            Quick Action
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
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
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-600">
                  {stat.change} from last month
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-1">
          <Card title="Alerts" subtitle="Require immediate attention">
            <div className="space-y-4">
              {alertCards.map((alert, index) => (
                <div key={index} className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
                  <div className={`bg-gradient-to-br ${alert.color} rounded-lg p-2 mr-3`}>
                    {alert.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{alert.title}</div>
                    <div className="text-sm text-gray-600">{alert.description}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{alert.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card title="Quick Actions" subtitle="Frequently used functions">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Add Student', icon: <Users className="w-5 h-5" />, color: 'blue' },
                { label: 'Add Vehicle', icon: <Car className="w-5 h-5" />, color: 'green' },
                { label: 'View Reports', icon: <TrendingUp className="w-5 h-5" />, color: 'purple' },
                { label: 'Send Notices', icon: <AlertCircle className="w-5 h-5" />, color: 'yellow' },
                { label: 'Manage Staff', icon: <Users className="w-5 h-5" />, color: 'red' },
                { label: 'Check Inventory', icon: <GraduationCap className="w-5 h-5" />, color: 'indigo' },
                { label: 'Schedule', icon: <Calendar className="w-5 h-5" />, color: 'pink' },
                { label: 'Settings', icon: <AlertCircle className="w-5 h-5" />, color: 'gray' }
              ].map((action, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${action.color}-100 to-${action.color}-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <div className={`text-${action.color}-600`}>{action.icon}</div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity" subtitle="Latest system activities">
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading activities...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
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
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default Dashboard
