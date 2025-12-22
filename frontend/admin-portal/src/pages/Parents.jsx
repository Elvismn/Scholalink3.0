import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, UserCircle, Users, Mail, Phone, Edit, Trash2, RefreshCw, MapPin, AlertCircle } from 'lucide-react'
import { Button, Modal, Input, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

// Inline Badge component
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
};

const Parents = () => {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingParent, setEditingParent] = useState(null)
  const [students, setStudents] = useState([])
  const [users, setUsers] = useState([])
  
  // Form data matches backend schema exactly
  const [formData, setFormData] = useState({
    userId: '',           // Reference to User model (backend field: 'user')
    children: [],
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [parentsRes, studentsRes, usersRes] = await Promise.all([
        adminApi.getParents(),
        adminApi.getStudents(),
        adminApi.getUsers({ role: 'parent' })
      ])
      
      console.log('📦 Parents API Response:', parentsRes)
      console.log('📦 Students API Response:', studentsRes)
      console.log('📦 Users API Response:', usersRes)
      
      // Normalize responses to arrays to avoid `.map` errors when the API returns objects
      const normalizeArray = (res) => {
        if (Array.isArray(res)) return res
        if (!res) return []
        if (Array.isArray(res.data)) return res.data
        if (Array.isArray(res.users)) return res.users
        if (res.data && Array.isArray(res.data.users)) return res.data.users
        return []
      }

      const parentsData = normalizeArray(parentsRes)
      const studentsData = normalizeArray(studentsRes)
      const usersData = normalizeArray(usersRes)
      
      setParents(parentsData)
      setStudents(studentsData)
      setUsers(usersData)
      
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      showToast.error('Failed to load data', error.data?.message || error.message)
      setParents([])
      setStudents([])
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Filter parents based on search term
  const filteredParents = useMemo(() => {
    if (!Array.isArray(parents)) return []
    if (!searchTerm) return parents
    
    const searchLower = searchTerm.toLowerCase()
    
    return parents.filter(parent => {
      if (!parent) return false
      
      // Access parent.user (matches backend schema)
      const parentName = `${parent.user?.firstName || ''} ${parent.user?.lastName || ''}`.toLowerCase()
      const parentEmail = parent.user?.email?.toLowerCase() || ''
      const parentPhone = parent.emergencyContact?.phone?.toLowerCase() || ''
      const address = `${parent.address?.street || ''} ${parent.address?.city || ''}`.toLowerCase()
      
      // Check if parent matches search
      if (
        parentName.includes(searchLower) ||
        parentEmail.includes(searchLower) ||
        parentPhone.includes(searchLower) ||
        address.includes(searchLower)
      ) {
        return true
      }
      
      // Check if any child matches search
      if (parent.children && Array.isArray(parent.children)) {
        return parent.children.some(child => {
          const childName = `${child.firstName || ''} ${child.lastName || ''}`.toLowerCase()
          const childId = child.studentId?.toLowerCase() || ''
          return childName.includes(searchLower) || childId.includes(searchLower)
        })
      }
      
      return false
    })
  }, [parents, searchTerm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Build payload matching backend schema exactly
      const parentData = {
        user: formData.userId,  // Backend expects 'user' field (User ObjectId)
        children: formData.children,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zipCode: formData.address.zipCode.trim()
        },
        emergencyContact: {
          name: formData.emergencyContact.name.trim(),
          relationship: formData.emergencyContact.relationship.trim(),
          phone: formData.emergencyContact.phone.trim()
        }
      }

      console.log('💾 Saving parent:', editingParent ? 'UPDATE' : 'CREATE', parentData)

      if (editingParent) {
        await adminApi.updateParent(editingParent._id, parentData)
        showToast.success('Parent updated successfully')
      } else {
        await adminApi.createParent(parentData)
        showToast.success('Parent created successfully')
      }
      
      await fetchData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Error saving parent:', error)
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (parentId) => {
    if (window.confirm('Are you sure you want to delete this parent? This action cannot be undone.')) {
      try {
        console.log('🗑️ Deleting parent:', parentId)
        await adminApi.deleteParent(parentId)
        showToast.success('Parent deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Error deleting parent:', error)
        showToast.error('Failed to delete parent', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      userId: '',
      children: [],
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    })
    setEditingParent(null)
  }

  const openCreateModal = () => {
    console.log('➕ Opening create modal')
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (parent) => {
    console.log('✏️ Opening edit modal for:', parent)
    setEditingParent(parent)
    
    // Populate form from parent.user (matches backend schema)
    setFormData({
      userId: parent.user?._id || '',
      children: Array.isArray(parent.children) 
        ? parent.children.map(child => child._id || child)
        : [],
      address: parent.address || {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      emergencyContact: parent.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      }
    })
    
    setIsModalOpen(true)
  }

  // Calculate stats safely
  const totalParents = parents.length || 0
  const totalStudentsLinked = Array.isArray(parents) 
    ? parents.reduce((total, parent) => total + (Array.isArray(parent.children) ? parent.children.length : 0), 0)
    : 0
  const averageChildren = totalParents > 0 ? (totalStudentsLinked / totalParents).toFixed(1) : '0.0'

  // Display parents - filtered if search is active
  const displayParents = filteredParents

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Parent Management</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredParents.length} of {parents.length} parents
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              'Manage parent accounts and child associations'
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchData}
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
            Add Parent
          </Button>
        </div>
      </div>

      {/* Search Status */}
      {searchTerm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700">
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredParents.length} results
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Parents</p>
              <p className="text-2xl font-bold">{totalParents}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students Linked</p>
              <p className="text-2xl font-bold">{totalStudentsLinked}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Average Children</p>
              <p className="text-2xl font-bold">{averageChildren}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Card */}
      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search parents by name, email, phone, address, or child's name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Parents Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading parents...</p>
          </div>
        ) : !Array.isArray(displayParents) || displayParents.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <UserCircle className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No parents found' : 'No parents yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No parents found for "${searchTerm}". Try a different search term.`
                : 'Get started by adding your first parent'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Parent
              </Button>
            )}
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayParents.map((parent) => {
              const childrenCount = Array.isArray(parent.children) ? parent.children.length : 0
              
              return (
                <div key={parent._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          {/* Access parent.user (matches backend schema) */}
                          <h3 className="font-semibold text-gray-900 truncate">
                            {parent.user?.firstName || 'Unknown'} {parent.user?.lastName || ''}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{parent.user?.email || 'No email'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => openEditModal(parent)} 
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(parent._id)} 
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {/* Access emergencyContact.phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{parent.emergencyContact?.phone || 'No phone number'}</span>
                    </div>
                    
                    {/* Display address */}
                    {parent.address && (parent.address.street || parent.address.city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="line-clamp-2">
                          {[parent.address.street, parent.address.city, parent.address.state, parent.address.zipCode]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>
                        <strong>Children:</strong> {childrenCount}
                      </span>
                    </div>
                    
                    {childrenCount > 0 && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-gray-700">Student Names:</span>
                        <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                          {parent.children.slice(0, 3).map(child => 
                            child.fullName || `${child.firstName || ''} ${child.lastName || ''}`.trim()
                          ).join(', ')}
                          {childrenCount > 3 && ` +${childrenCount - 3} more`}
                        </div>
                      </div>
                    )}
                    
                    {/* Emergency Contact */}
                    {parent.emergencyContact?.name && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <AlertCircle className="w-3 h-3" />
                          <span className="font-medium">Emergency:</span>
                          <span>{parent.emergencyContact.name}</span>
                          {parent.emergencyContact.relationship && (
                            <span className="text-gray-400">({parent.emergencyContact.relationship})</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {parent.createdAt && (
                    <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                      Created: {new Date(parent.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal with proper form fields */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingParent(null)
          resetForm()
        }}
        closeOnBackdropClick={false}
        title={editingParent ? 'Edit Parent' : 'Add New Parent'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Parent User Account *
            </label>
            <select
              required
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={Boolean(editingParent)}
            >
              <option value="">Choose a user account...</option>
              {Array.isArray(users) && users.map(user => (
                <option key={user._id} value={user._id}>
                  {user?.firstName || ''} {user?.lastName || ''} ({user?.email || ''})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              {editingParent 
                ? 'User account cannot be changed after creation'
                : 'Select the user account this parent profile will be linked to'
              }
            </p>
          </div>

          {/* Address Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <Input
              placeholder="Street Address"
              value={formData.address.street}
              onChange={(e) => setFormData({
                ...formData, 
                address: {...formData.address, street: e.target.value}
              })}
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="City"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData, 
                  address: {...formData.address, city: e.target.value}
                })}
              />
              <Input
                placeholder="State"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData, 
                  address: {...formData.address, state: e.target.value}
                })}
              />
              <Input
                placeholder="Zip Code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData, 
                  address: {...formData.address, zipCode: e.target.value}
                })}
              />
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <Input
              placeholder="Contact Name"
              value={formData.emergencyContact.name}
              onChange={(e) => setFormData({
                ...formData, 
                emergencyContact: {...formData.emergencyContact, name: e.target.value}
              })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => setFormData({
                  ...formData, 
                  emergencyContact: {...formData.emergencyContact, relationship: e.target.value}
                })}
              />
              <Input
                placeholder="Phone Number"
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => setFormData({
                  ...formData, 
                  emergencyContact: {...formData.emergencyContact, phone: e.target.value}
                })}
              />
            </div>
          </div>

          {/* Children Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Children
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {!Array.isArray(students) || students.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No students available</p>
              ) : (
                <div className="space-y-2">
                  {students.map(student => (
                    <label key={student._id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.children.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              children: [...formData.children, student._id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              children: formData.children.filter(id => id !== student._id)
                            })
                          }
                        }}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {student.firstName} {student.lastName}
                        {student.grade && ` - ${student.grade}`}
                        {student.studentId && ` (ID: ${student.studentId})`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.children.length > 0 && (
              <p className="text-sm text-gray-500">
                Selected: {formData.children.length} student{formData.children.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Info Box */}
          {!editingParent && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Before creating a parent:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Make sure the user account exists in the Users section</li>
                    <li>The user should have the role "parent"</li>
                    <li>This parent profile will be linked to that user account</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingParent(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingParent ? 'Update Parent' : 'Create Parent'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Parents