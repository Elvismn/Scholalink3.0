// API endpoint constants for the entire application
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me'
  },

  // Admin endpoints
  ADMIN: {
    // Students
    STUDENTS: '/admin/students',
    STUDENT_BY_ID: (id) => `/admin/students/${id}`,
    
    // Parents
    PARENTS: '/admin/parents',
    PARENT_BY_ID: (id) => `/admin/parents/${id}`,
    
    // Staff
    STAFF: '/admin/staff',
    STAFF_BY_ID: (id) => `/admin/staff/${id}`,
    
    // Classrooms
    CLASSROOMS: '/admin/classrooms',
    CLASSROOM_BY_ID: (id) => `/admin/classrooms/${id}`,
    
    // Grades
    GRADES: '/admin/grades',
    GRADE_BY_ID: (id) => `/admin/grades/${id}`,
    
    // Courses
    COURSES: '/admin/courses',
    COURSE_BY_ID: (id) => `/admin/courses/${id}`,
    
    // Departments
    DEPARTMENTS: '/admin/departments',
    DEPARTMENT_BY_ID: (id) => `/admin/departments/${id}`,
    
    // Inventory
    INVENTORY: '/admin/inventory',
    INVENTORY_BY_ID: (id) => `/admin/inventory/${id}`,
    
    // Clubs
    CLUBS: '/admin/clubs',
    CLUB_BY_ID: (id) => `/admin/clubs/${id}`,
    
    // Stakeholders
    STAKEHOLDERS: '/admin/stakeholders',
    STAKEHOLDER_BY_ID: (id) => `/admin/stakeholders/${id}`,
    
    // Vehicles
    VEHICLES: '/admin/vehicles',
    VEHICLE_BY_ID: (id) => `/admin/vehicles/${id}`,
    VEHICLES_NEEDING_SERVICE: '/admin/vehicles/needing-service',
    VEHICLE_ANALYTICS: (id) => `/admin/vehicles/${id}/analytics`,
    
    // Fuel Records
    FUEL_RECORDS: '/admin/fuel-records',
    FUEL_RECORD_BY_ID: (id) => `/admin/fuel-records/${id}`,
    UNVERIFIED_FUEL_RECORDS: '/admin/fuel-records/unverified',
    FUEL_ANALYTICS: (vehicleId) => `/admin/fuel-records/vehicle/${vehicleId}/analytics`,
    
    // Maintenance
    MAINTENANCE: '/admin/maintenance',
    MAINTENANCE_BY_ID: (id) => `/admin/maintenance/${id}`,
    UPCOMING_MAINTENANCE: '/admin/maintenance/upcoming',
    MAINTENANCE_ANALYTICS: (vehicleId) => `/admin/maintenance/vehicle/${vehicleId}/analytics`,
    MAINTENANCE_FORECAST: (vehicleId) => `/admin/maintenance/vehicle/${vehicleId}/forecast`,
    
    // Vehicle Documents
    VEHICLE_DOCUMENTS: '/admin/vehicle-documents',
    VEHICLE_DOCUMENT_BY_ID: (id) => `/admin/vehicle-documents/${id}`,
    EXPIRING_DOCUMENTS: '/admin/vehicle-documents/expiring',
    EXPIRED_DOCUMENTS: '/admin/vehicle-documents/expired',
    DOCUMENT_ANALYTICS: (vehicleId) => `/admin/vehicle-documents/vehicle/${vehicleId}/analytics`,
    BULK_UPDATE_DOCUMENTS: '/admin/vehicle-documents/bulk-update',
    RENEW_DOCUMENT: (id) => `/admin/vehicle-documents/${id}/renew`,
    VERIFY_DOCUMENT: (id) => `/admin/vehicle-documents/${id}/verify`
  },

  // Parent endpoints
  PARENT: {
    PROFILE: '/parents/profile',
    CHILDREN: '/parents/children',
    CHILD_BY_ID: (id) => `/parents/children/${id}`,
    CHILD_ACADEMICS: (childId) => `/parents/children/${childId}/academics`,
    ATTENDANCE: (childId) => `/parents/children/${childId}/attendance`,
    GRADES: (childId) => `/parents/children/${childId}/grades`,
    NOTIFICATIONS: '/parents/notifications'
  }
};

// Common HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Helper function to build query parameters
export const buildQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => queryParams.append(`${key}[]`, item));
      } else {
        queryParams.append(key, value);
      }
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};
