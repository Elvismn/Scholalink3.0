import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, User, Mail, Shield, CheckCircle, XCircle, Edit, Trash2, RefreshCw, Key, AlertCircle } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [formData, setFormData] = useState({
    email: '',
    password: '',  // Required for new users
    confirmPassword: '',  // Required for new users
    role: 'parent',
    profile: {
      firstName: '',
      lastName: '',
      phone: ''
    }
  })

  // Debug: Track modal state changes
  useEffect(() => {
    console.log('🔄 Users Modal: isModalOpen changed to:', isModalOpen);
  }, [isModalOpen]);

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getUsers()
      console.log('📦 Users API Response:', response)
      
      // Handle different response structures
      let usersData = []
      if (Array.isArray(response)) {
        usersData = response
      } else if (response && Array.isArray(response.data)) {
        usersData = response.data
      } else if (response && response.data && response.data.users) {
        usersData = response.data.users
      } else if (response && response.data) {
        // Check if data is an object with users array
        if (Array.isArray(response.data)) {
          usersData = response.data
        }
      }
      
      console.log('✅ Normalized Users:', usersData)
      setUsers(usersData || [])
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      showToast.error('Failed to load users', error.data?.message || error.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Validate password for new users
      if (!editingUser) {
        if (!formData.password) {
          showToast.error('Password is required for new users')
          setSubmitting(false)
          return
        }
        if (formData.password !== formData.confirmPassword) {
          showToast.error('Passwords do not match')
          setSubmitting(false)
          return
        }
        if (formData.password.length < 6) {
          showToast.error('Password must be at least 6 characters')
          setSubmitting(false)
          return
        }
      }

      // Prepare user data according to backend schema
      const userData = {
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        profile: {
          firstName: formData.profile.firstName.trim(),
          lastName: formData.profile.lastName.trim(),
          phone: formData.profile.phone.trim()
        }
      }

      // For new users, include password
      if (!editingUser) {
        userData.password = formData.password
        userData.confirmPassword = formData.confirmPassword
      }

      console.log('💾 Saving user:', editingUser ? 'UPDATE' : 'CREATE', userData)

      if (editingUser) {
        await adminApi.updateUser(editingUser._id, userData)
        showToast.success('User updated successfully')
      } else {
        await adminApi.createUser(userData)
        showToast.success('User created successfully')
      }
      
      setIsModalOpen(false)
      setEditingUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('❌ Error saving user:', error)
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error('Passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters')
      return
    }
    
    setSubmitting(true)
    try {
      // Create password reset payload
      const passwordResetData = {
        password: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      }
      
      // Use updateUser endpoint for password reset
      await adminApi.updateUser(editingUser._id, passwordResetData)
      showToast.success('Password reset successfully')
      setIsPasswordModalOpen(false)
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('❌ Error resetting password:', error)
      showToast.error('Failed to reset password', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        console.log('🗑️ Deleting user:', userId)
        await adminApi.deleteUser(userId)
        showToast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        console.error('❌ Error deleting user:', error)
        showToast.error('Failed to delete user', error.data?.message || error.message)
      }
    }
  }

  const toggleUserStatus = async (user) => {
    try {
      const newStatus = !user.isActive
      console.log('🔄 Toggling user status:', user._id, 'to', newStatus)
      await adminApi.updateUser(user._id, { isActive: newStatus })
      showToast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('❌ Error updating user status:', error)
      showToast.error('Failed to update user status', error.data?.message || error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      role: 'parent',
      profile: {
        firstName: '',
        lastName: '',
        phone: ''
      }
    })
  }

  const openCreateModal = () => {
    console.log('➕ Opening create user modal')
    setEditingUser(null)
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (user) => {
    console.log('✏️ Opening edit modal for:', user)
    setEditingUser(user)
    
    setFormData({
      email: user.email || '',
      password: '',  // Don't show password when editing
      confirmPassword: '',  // Don't show confirm password when editing
      role: user.role || 'parent',
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || ''
      }
    })
    
    setIsModalOpen(true)
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-red-100 text-red-800'
      case 'teacher': return 'bg-blue-100 text-blue-800'
      case 'staff': return 'bg-yellow-100 text-yellow-800'
      case 'parent': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const columns = [
    {
      key: 'profile',
      title: 'User',
      render: (_, user) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {user.profile?.firstName} {user.profile?.lastName}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Role',
      render: (role) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role)}`}>
          {getRoleLabel(role)}
        </span>
      )
    },
    {
      key: 'profile.phone',
      title: 'Phone',
      render: (_, user) => (
        <div className="text-gray-900">{user.profile?.phone || 'N/A'}</div>
      )
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      render: (date) => (
        <div className="text-sm text-gray-500">
          {date ? new Date(date).toLocaleDateString() : 'Never'}
        </div>
      )
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (isActive) => (
        <div className="flex items-center">
          {isActive ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-700">Active</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-700">Inactive</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, user) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(user)}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingUser(user)
              setIsPasswordModalOpen(true)
            }}
            className="p-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded"
            title="Reset Password"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleUserStatus(user)}
            className={`p-1 rounded ${
              user.isActive 
                ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
            }`}
            title={user.isActive ? 'Deactivate' : 'Activate'}
          >
            {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleDelete(user._id)}
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  // Use useMemo for filteredUsers to prevent re-renders
  const filteredUsers = useMemo(() => {
    console.log('🔍 Filtering users:', users.length)
    if (!Array.isArray(users)) return []
    if (!searchTerm && roleFilter === 'all' && statusFilter === 'all') return users
    
    const searchLower = searchTerm.toLowerCase()
    
    return users.filter(user => {
      if (!user) return false
      
      const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.toLowerCase()
      const matchesSearch = searchTerm ? (
        fullName.includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.profile?.phone?.toLowerCase().includes(searchLower)
      ) : true
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive)
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  // Calculate stats safely
  const activeUsers = Array.isArray(users) ? users.filter(u => u.isActive).length : 0
  const adminCount = Array.isArray(users) ? users.filter(u => u.role === 'admin' || u.role === 'super_admin').length : 0
  const parentCount = Array.isArray(users) ? users.filter(u => u.role === 'parent').length : 0
  const teacherCount = Array.isArray(users) ? users.filter(u => u.role === 'teacher').length : 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and access permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchUsers}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{Array.isArray(users) ? users.length : 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">{activeUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold">{adminCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Parents</p>
              <p className="text-2xl font-bold">{parentCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* FIXED: Select component - use value prop only (not defaultValue) */}
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'super_admin', label: 'Super Admin' },
              { value: 'admin', label: 'Admin' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'staff', label: 'Staff' },
              { value: 'parent', label: 'Parent' }
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('')
              setRoleFilter('all')
              setStatusFilter('all')
            }}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : !Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'No users match your search criteria' 
                : 'No users found'
              }
            </p>
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') ? (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={openCreateModal}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First User
              </Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredUsers}
            keyField="_id"
            emptyMessage="No users match your search"
          />
        )}
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('🟢 User modal onClose triggered')
          setIsModalOpen(false)
          setEditingUser(null)
          resetForm()
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={formData.profile.firstName}
              onChange={(e) => setFormData({
                ...formData,
                profile: { ...formData.profile, firstName: e.target.value }
              })}
            />
            <Input
              label="Last Name"
              required
              value={formData.profile.lastName}
              onChange={(e) => setFormData({
                ...formData,
                profile: { ...formData.profile, lastName: e.target.value }
              })}
            />
          </div>

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              value={formData.profile.phone}
              onChange={(e) => setFormData({
                ...formData,
                profile: { ...formData.profile, phone: e.target.value }
              })}
            />
            {/* FIXED: Select component with only value prop */}
            <Select
              label="Role"
              required
              options={[
                { value: 'parent', label: 'Parent' },
                { value: 'teacher', label: 'Teacher' },
                { value: 'staff', label: 'Staff' },
                { value: 'admin', label: 'Admin' }
              ]}
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            />
          </div>

          {/* Password fields for new users only */}
          {!editingUser && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Password</h3>
                <Input
                  label="Password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  helperText="Minimum 6 characters"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Password Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 6 characters long</li>
                      <li>User should change password on first login</li>
                      <li>Store password securely</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info for editing users */}
          {editingUser && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Editing User:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Leave password fields empty to keep current password</li>
                    <li>Use "Reset Password" button to change password</li>
                    <li>Role changes may affect user permissions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                console.log('🔘 Cancel button clicked')
                setIsModalOpen(false)
                setEditingUser(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          console.log('🔢 Password modal onClose triggered')
          setIsPasswordModalOpen(false)
          setPasswordData({ newPassword: '', confirmPassword: '' })
        }}
        title="Reset Password"
        size="md"
      >
        {editingUser && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Reset password for <strong>{editingUser.profile?.firstName} {editingUser.profile?.lastName}</strong>
            </p>
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            helperText="Minimum 6 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
          />
          
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false)
                setPasswordData({ newPassword: '', confirmPassword: '' })
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users