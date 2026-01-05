// API endpoint constants for the entire application
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    FORGOT_PASSWORD: '/api/admin/users/forgot-password',
    RESET_PASSWORD: '/api/admin/users/reset-password',
    CHANGE_PASSWORD: '/api/admin/users/change-password',
    ME: '/api/auth/me'
  },

  // Admin endpoints
  ADMIN: {
    // Users
    USERS: '/api/admin/users',
    USER_BY_ID: (id) => `/api/admin/users/${id}`,

    // Curriculum
    CURRICULUMS: '/api/admin/curriculums',
    CURRICULUM_BY_ID: (id) => `/api/admin/curriculums/${id}`,

    // Students
    STUDENTS: '/api/admin/students',
    STUDENT_BY_ID: (id) => `/api/admin/students/${id}`,
    
    // Parents
    PARENTS: '/api/admin/parents',
    PARENT_BY_ID: (id) => `/api/admin/parents/${id}`,
    
    // Staff
    STAFF: '/api/admin/staff',
    STAFF_BY_ID: (id) => `/api/admin/staff/${id}`,
    
    // Classrooms
    CLASSROOMS: '/api/admin/classrooms',
    CLASSROOM_BY_ID: (id) => `/api/admin/classrooms/${id}`,
    
    // Grades
    GRADES: '/api/admin/grades',
    GRADE_BY_ID: (id) => `/api/admin/grades/${id}`,
    
    // Courses
    COURSES: '/api/admin/courses',
    COURSE_BY_ID: (id) => `/api/admin/courses/${id}`,
    
    // Departments
    DEPARTMENTS: '/api/admin/departments',
    DEPARTMENT_BY_ID: (id) => `/api/admin/departments/${id}`,
    
    // Inventory
    INVENTORY: '/api/admin/inventory',
    INVENTORY_BY_ID: (id) => `/api/admin/inventory/${id}`,
    
    // Clubs
    CLUBS: '/api/admin/clubs',
    CLUB_BY_ID: (id) => `/api/admin/clubs/${id}`,
    
    // Stakeholders
    STAKEHOLDERS: '/api/admin/stakeholders',
    STAKEHOLDER_BY_ID: (id) => `/api/admin/stakeholders/${id}`,
    
    // Vehicles
    VEHICLES: '/api/admin/vehicles',
    VEHICLE_BY_ID: (id) => `/api/admin/vehicles/${id}`,
    VEHICLES_NEEDING_SERVICE: '/api/admin/vehicles/needing-service',
    VEHICLE_ANALYTICS: (id) => `/api/admin/vehicles/${id}/analytics`,
    
    // Fuel Records
    FUEL_RECORDS: '/api/admin/fuel-records',
    FUEL_RECORD_BY_ID: (id) => `/api/admin/fuel-records/${id}`,
    UNVERIFIED_FUEL_RECORDS: '/api/admin/fuel-records/unverified',
    FUEL_ANALYTICS: (vehicleId) => `/api/admin/fuel-records/vehicle/${vehicleId}/analytics`,
    
    // Maintenance
    MAINTENANCE: '/api/admin/maintenance',
    MAINTENANCE_BY_ID: (id) => `/api/admin/maintenance/${id}`,
    UPCOMING_MAINTENANCE: '/api/admin/maintenance/upcoming',
    MAINTENANCE_ANALYTICS: (vehicleId) => `/api/admin/maintenance/vehicle/${vehicleId}/analytics`,
    MAINTENANCE_FORECAST: (vehicleId) => `/api/admin/maintenance/vehicle/${vehicleId}/forecast`,
    
    // Vehicle Documents
    VEHICLE_DOCUMENTS: '/api/admin/vehicle-documents',
    VEHICLE_DOCUMENT_BY_ID: (id) => `/api/admin/vehicle-documents/${id}`,
    EXPIRING_DOCUMENTS: '/api/admin/vehicle-documents/expiring',
    EXPIRED_DOCUMENTS: '/api/admin/vehicle-documents/expired',
    DOCUMENT_ANALYTICS: (vehicleId) => `/api/admin/vehicle-documents/vehicle/${vehicleId}/analytics`,
    BULK_UPDATE_DOCUMENTS: '/api/admin/vehicle-documents/bulk-update',
    RENEW_DOCUMENT: (id) => `/api/admin/vehicle-documents/${id}/renew`,
    VERIFY_DOCUMENT: (id) => `/api/admin/vehicle-documents/${id}/verify`
  },

  // Parent endpoints
  PARENT: {
    PROFILE: '/api/parents/profile',
    CHILDREN: '/api/parents/children',
    CHILD_BY_ID: (id) => `/api/parents/children/${id}`,
    CHILD_ACADEMICS: (childId) => `/api/parents/children/${childId}/academics`,
    ATTENDANCE: (childId) => `/api/parents/children/${childId}/attendance`,
    GRADES: (childId) => `/api/parents/children/${childId}/grades`,
    NOTIFICATIONS: '/api/parents/notifications'
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