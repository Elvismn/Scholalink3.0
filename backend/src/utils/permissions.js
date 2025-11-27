// backend/src/utils/permissions.js
const rolePermissions = {
  super_admin: {
    canManageUsers: true,
    canManageStudents: true,
    canManageStaff: true,
    canManageInventory: true,
    canViewAnalytics: true
  },
  admin: {
    canManageUsers: true,
    canManageStudents: true,
    canManageStaff: true,
    canManageInventory: true,
    canViewAnalytics: true
  },
  staff: {
    canManageUsers: false,
    canManageStudents: false,
    canManageStaff: false,
    canManageInventory: true,
    canViewAnalytics: false
  },
  teacher: {
    canManageUsers: false,
    canManageStudents: true,
    canManageStaff: false,
    canManageInventory: false,
    canViewAnalytics: false
  },
  parent: {
    canManageUsers: false,
    canManageStudents: false,
    canManageStaff: false,
    canManageInventory: false,
    canViewAnalytics: false
  }
};

const getPermissionsForRole = (role) => {
  return rolePermissions[role] || rolePermissions.parent;
};

const hasPermission = (user, permission) => {
  const permissions = getPermissionsForRole(user.role);
  return permissions[permission] || false;
};

module.exports = {
  rolePermissions,
  getPermissionsForRole,
  hasPermission
};