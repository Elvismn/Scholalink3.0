// utils/dashboardNavigation.js
export const quickActions = [
  { 
    label: 'Add Student', 
    icon: 'Users', 
    color: 'blue',
    path: '/dashboard/students'
  },
  { 
    label: 'Add Vehicle', 
    icon: 'Car', 
    color: 'green',
    path: '/dashboard/vehicles' 
  },
  { 
    label: 'View Reports', 
    icon: 'TrendingUp', 
    color: 'purple',
    path: '/dashboard' // You might want to create a reports page
  },
  { 
    label: 'Send Notices', 
    icon: 'AlertCircle', 
    color: 'yellow',
    path: '/dashboard' // You might want to create a notices page
  },
  { 
    label: 'Manage Staff', 
    icon: 'Users', 
    color: 'red',
    path: '/dashboard/staff' 
  },
  { 
    label: 'Check Inventory', 
    icon: 'GraduationCap', 
    color: 'indigo',
    path: '/dashboard/inventory' 
  },
  { 
    label: 'Schedule', 
    icon: 'Calendar', 
    color: 'pink',
    path: '/dashboard' // You might want to create a schedule page
  },
  { 
    label: 'Settings', 
    icon: 'AlertCircle', 
    color: 'gray',
    path: '/dashboard/settings' 
  }
]

export const alertNavigation = {
  'Upcoming Maintenance': '/dashboard/maintenance',
  'Expiring Documents': '/dashboard/vehicle-documents'
}