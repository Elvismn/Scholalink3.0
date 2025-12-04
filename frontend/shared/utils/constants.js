// Application-wide constants

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PARENT: 'parent',
  STUDENT: 'student',
  TEACHER: 'teacher',
  STAFF: 'staff'
};

export const VEHICLE_STATUS = {
  ACTIVE: 'Active',
  MAINTENANCE: 'Maintenance',
  ACCIDENT: 'Accident',
  OUT_OF_SERVICE: 'Out of Service'
};

export const FUEL_TYPES = {
  DIESEL: 'Diesel',
  PETROL: 'Petrol',
  ELECTRIC: 'Electric',
  HYBRID: 'Hybrid'
};

export const VEHICLE_TYPES = {
  BUS: 'Bus',
  VAN: 'Van',
  MINIBUS: 'Minibus',
  SEDAN: 'Sedan',
  SUV: 'SUV'
};

export const MAINTENANCE_TYPES = {
  ROUTINE: 'Routine',
  REPAIR: 'Repair',
  EMERGENCY: 'Emergency',
  PREVENTIVE: 'Preventive'
};

export const DOCUMENT_TYPES = {
  INSURANCE: 'Insurance',
  REGISTRATION: 'Registration',
  FITNESS_CERTIFICATE: 'Fitness Certificate',
  PERMIT: 'Permit',
  OTHER: 'Other'
};

export const STUDENT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  GRADUATED: 'Graduated',
  TRANSFERRED: 'Transferred'
};

export const STAFF_POSITIONS = [
  'Principal',
  'Vice Principal',
  'Teacher',
  'Accountant',
  'Secretary',
  'Driver',
  'Cleaner',
  'Security',
  'Other'
];

export const GRADE_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12'
];

// Pagination defaults
export const PAGINATION = {
  PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100]
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm'
};

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
};
