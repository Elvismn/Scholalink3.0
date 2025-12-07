import { useState, useEffect } from 'react'
import { Search, Plus, User, Mail, Shield, CheckCircle, XCircle, Edit, Trash2, RefreshCw, Key } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { USER_ROLES } from '@shared'
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
    role: 'parent',
    profile: {
      firstName: '',
      lastName: '',
      phone: ''
    }
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getUsers()
      setUsers(response.data || response || [])
    } catch (error) {
      showToast.error('Failed to load users', error.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const userData = {
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        profile: {
          firstName: formData.profile.firstName.trim(),
          lastName: formData.profile.lastName.trim(),
          phone: formData.profile.phone.trim()
        }
      }

      if (editingUser) {
        await adminApi.updateUser(editingUser._id, userData)
        showToast.success('User updated successfully')
      } else {
        // For new users, we need to include password
        const newUserData = {
          ...userData,
          password: 'default123', // You should prompt for password
          confirmPassword: 'default123'
        }
        await adminApi.createUser(newUserData)
        showToast.success('User created successfully')
      }
      
      setIsModalOpen(false)
      setEditingUser(null)
      setFormData({
        email: '',
        role: 'parent',
        profile: {
          firstName: '',
          lastName: '',
          phone: ''
        }
      })
      fetchUsers()
    } catch (error) {
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
    
    setSubmitting(true)
    try {
      // You'll need to implement this API endpoint
      showToast.info('Password reset feature coming soon')
      setIsPasswordModalOpen(false)
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (error) {
      showToast.error('Failed to change password', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminApi.deleteUser(userId)
        showToast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        showToast.error('Failed to delete user', error.data?.message || error.message)
      }
    }
  }

  const toggleUserStatus = async (user) => {
    try {
      await adminApi.updateUser(user._id, { isActive: !user.isActive })
      showToast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      showToast.error('Failed to update user status', error.data?.message || error.message)
    }
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
      render: (phone) => (
        <div className="text-gray-900">{phone || 'N/A'}</div>
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
            onClick={() => {
              setEditingUser(user)
              setFormData({
                email: user.email || '',
                role: user.role || 'parent',
                profile: {
                  firstName: user.profile?.firstName || '',
                  lastName: user.profile?.lastName || '',
                  phone: user.profile?.phone || ''
                }
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              // Set user for password reset
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

  const filteredUsers = users.filter(user => {
    if (!searchTerm && roleFilter === 'all' && statusFilter === 'all') return true
    
    const searchLower = searchTerm.toLowerCase()
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

  const activeUsers = users.filter(u => u.isActive).length
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length
  const parentCount = users.filter(u => u.role === 'parent').length
  const teacherCount = users.filter(u => u.role === 'teacher').length

  return (
    <div className="space-y-6">
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
            onClick={() => {
              setEditingUser(null)
              setFormData({
                email: '',
                role: 'parent',
                profile: {
                  firstName: '',
                  lastName: '',
                  phone: ''
                }
              })
              setIsModalOpen(true)
            }}
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
              <p className="text-2xl font-bold">{users.length}</p>
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
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
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
                onClick={() => {
                  setFormData({
                    email: '',
                    role: 'parent',
                    profile: {
                      firstName: '',
                      lastName: '',
                      phone: ''
                    }
                  })
                  setIsModalOpen(true)
                }}
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
          setIsModalOpen(false)
          setEditingUser(null)
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

          {!editingUser && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> New users will be created with a default password. 
                Please instruct them to change their password on first login.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingUser(null)
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
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
          />
          
          <div className="pt-4 flex justify-end gap-3">
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