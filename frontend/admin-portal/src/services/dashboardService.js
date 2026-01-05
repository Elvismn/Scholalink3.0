// services/dashboardService.js
import { adminApi } from './adminApi'

class DashboardService {
  constructor() {
    this.cacheDuration = 30000
    this.cache = {
      data: null,
      timestamp: null
    }
  }

  isCacheValid() {
    if (!this.cache.timestamp || !this.cache.data) return false
    return Date.now() - this.cache.timestamp < this.cacheDuration
  }

  async getDashboardStats() {
    if (this.isCacheValid()) {
      return this.cache.data
    }

    try {
      // Fetch all data in parallel
      const [
        studentsRes,
        vehiclesRes,
        parentsRes,
        fuelRes,
        maintenanceRes,
        upcomingRes,
        expiringRes
      ] = await Promise.allSettled([
        adminApi.getStudents({ limit: 1 }),
        adminApi.getVehicles(),
        adminApi.getParents(),
        adminApi.getFuelRecords(),
        adminApi.getMaintenanceRecords(),
        adminApi.getUpcomingMaintenance(),
        adminApi.getExpiringDocuments()
      ])

      // Process counts
      const totalStudents = this.extractCount(studentsRes, 'students')
      const totalVehicles = this.extractCount(vehiclesRes)
      const activeParents = this.extractCount(parentsRes)
      const monthlyExpenditure = this.calculateMonthlyExpenditure(fuelRes, maintenanceRes)
      const upcomingMaintenance = this.extractCount(upcomingRes)
      const expiringDocuments = this.extractCount(expiringRes)

      // Get recent activities
      const recentActivity = await this.getRecentActivities()

      const dashboardData = {
        totalStudents,
        totalVehicles,
        activeParents,
        monthlyExpenditure,
        upcomingMaintenance,
        expiringDocuments,
        recentActivity,
        lastUpdated: new Date().toISOString()
      }

      this.cache = {
        data: dashboardData,
        timestamp: Date.now()
      }

      return dashboardData

    } catch (error) {
      console.error('DashboardService Error:', error)
      return this.getFallbackData()
    }
  }

  extractCount(response, dataKey = null) {
    if (response.status !== 'fulfilled') return 0
    const data = response.value.data || response.value
    
    if (dataKey && data[dataKey]) {
      return Array.isArray(data[dataKey]) ? data[dataKey].length : 0
    }
    
    if (Array.isArray(data)) {
      return data.length
    }
    
    return data.total || 0
  }

  calculateMonthlyExpenditure(fuelRes, maintenanceRes) {
    try {
      let total = 0
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Fuel expenditure (verified records only)
      if (fuelRes.status === 'fulfilled') {
        const records = this.extractArray(fuelRes.value, 'fuelRecords')
        records.forEach(record => {
          if (record.verified && record.date && record.totalCost) {
            const date = new Date(record.date)
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
              total += parseFloat(record.totalCost) || 0
            }
          }
        })
      }

      // Maintenance expenditure (completed records only)
      if (maintenanceRes.status === 'fulfilled') {
        const records = this.extractArray(maintenanceRes.value, 'maintenance')
        records.forEach(record => {
          if (record.status === 'completed' && record.date && record.cost) {
            const date = new Date(record.date)
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
              total += parseFloat(record.cost) || 0
            }
          }
        })
      }

      return Math.round(total)
    } catch (error) {
      console.error('Expenditure calculation error:', error)
      return 0
    }
  }

  extractArray(data, key = null) {
    if (!data) return []
    
    const dataObj = data.data || data
    
    if (key && dataObj[key] && Array.isArray(dataObj[key])) {
      return dataObj[key]
    }
    
    if (Array.isArray(dataObj)) {
      return dataObj
    }
    
    return []
  }

  async getRecentActivities() {
    try {
      // Fetch latest records for different types
      const [studentsRes, vehiclesRes, parentsRes, fuelRes, maintenanceRes] = await Promise.allSettled([
        adminApi.getStudents({ limit: 3, sort: '-createdAt' }),
        adminApi.getVehicles({ limit: 2 }),
        adminApi.getParents({ limit: 2 }),
        adminApi.getFuelRecords({ limit: 2, sort: '-date' }),
        adminApi.getMaintenanceRecords({ limit: 2, sort: '-date' })
      ])

      const activities = []

      // Add student activities
      if (studentsRes.status === 'fulfilled') {
        const students = this.extractArray(studentsRes.value, 'students')
        students.forEach(student => {
          activities.push({
            id: `student-${student._id || Date.now()}`,
            action: 'New student registered',
            time: student.createdAt || new Date().toISOString(),
            user: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'New Student',
            type: 'student'
          })
        })
      }

      // Add vehicle activities
      if (vehiclesRes.status === 'fulfilled') {
        const vehicles = this.extractArray(vehiclesRes.value)
        vehicles.forEach(vehicle => {
          activities.push({
            id: `vehicle-${vehicle._id || Date.now()}`,
            action: 'Vehicle added to fleet',
            time: vehicle.createdAt || new Date().toISOString(),
            user: `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'New Vehicle',
            type: 'vehicle'
          })
        })
      }

      // Add parent activities
      if (parentsRes.status === 'fulfilled') {
        const parents = this.extractArray(parentsRes.value)
        parents.forEach(parent => {
          activities.push({
            id: `parent-${parent._id || Date.now()}`,
            action: 'Parent account created',
            time: parent.createdAt || new Date().toISOString(),
            user: `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || 'New Parent',
            type: 'parent'
          })
        })
      }

      // Add fuel activities
      if (fuelRes.status === 'fulfilled') {
        const fuelRecords = this.extractArray(fuelRes.value, 'fuelRecords')
        fuelRecords.forEach(record => {
          activities.push({
            id: `fuel-${record._id || Date.now()}`,
            action: 'Fuel record added',
            time: record.date || record.createdAt || new Date().toISOString(),
            user: record.vehicle?.plateNumber || 'Vehicle',
            type: 'fuel'
          })
        })
      }

      // Add maintenance activities
      if (maintenanceRes.status === 'fulfilled') {
        const maintenanceRecords = this.extractArray(maintenanceRes.value, 'maintenance')
        maintenanceRecords.forEach(record => {
          activities.push({
            id: `maintenance-${record._id || Date.now()}`,
            action: 'Maintenance recorded',
            time: record.date || record.createdAt || new Date().toISOString(),
            user: record.vehicle?.plateNumber || 'Vehicle',
            type: 'maintenance'
          })
        })
      }

      // Sort by time (newest first) and format
      return activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5)
        .map(activity => ({
          ...activity,
          time: this.formatRelativeTime(activity.time)
        }))

    } catch (error) {
      console.error('Recent activities error:', error)
      return this.getFallbackActivities()
    }
  }

  formatRelativeTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  getFallbackData() {
    return {
      totalStudents: 0,
      totalVehicles: 0,
      activeParents: 0,
      monthlyExpenditure: 0,
      upcomingMaintenance: 0,
      expiringDocuments: 0,
      recentActivity: this.getFallbackActivities(),
      lastUpdated: new Date().toISOString()
    }
  }

  getFallbackActivities() {
    return [
      { id: 1, action: 'System initialized', time: 'just now', user: 'System', type: 'system' },
      { id: 2, action: 'Waiting for data...', time: 'just now', user: 'System', type: 'system' }
    ]
  }

  clearCache() {
    this.cache = {
      data: null,
      timestamp: null
    }
  }
}

export const dashboardService = new DashboardService()