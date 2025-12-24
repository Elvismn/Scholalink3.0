import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Building, Users, DollarSign, Edit, Trash2, RefreshCw } from 'lucide-react'
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

const Departments = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [staff, setStaff] = useState([])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    head: '',
    description: '',
    contactEmail: '',
    budget: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Departments - Fetching data...')
      const [deptRes, staffRes] = await Promise.all([
        adminApi.getDepartments(),
        adminApi.getStaff()
      ])
      
      console.log('✅ Departments - Data received:', deptRes)
      
      // FIXED: Use the same normalization as Parents.jsx
      const normalizeArray = (res) => {
        if (!res) return []
        
        // Direct array
        if (Array.isArray(res)) return res
        
        // Your structure: { data: { departments: [...] } } or { data: { staff: [...] } }
        if (res.data) {
          // Check for nested arrays in data object
          if (Array.isArray(res.data.departments)) return res.data.departments
          if (Array.isArray(res.data.staff)) return res.data.staff
          
          // Fallback to data if it's an array
          if (Array.isArray(res.data)) return res.data
        }
        
        return []
      }

      const departmentsData = normalizeArray(deptRes)
      const staffData = normalizeArray(staffRes)
      
      console.log('✅ Normalized Departments:', departmentsData)
      console.log('✅ Normalized Staff:', staffData)
      
      setDepartments(departmentsData)
      setStaff(staffData)
      
      setError('')
    } catch (error) {
      console.error('❌ Departments - Error fetching data:', error)
      setError('Failed to load data. Please check your connection and try again.')
      showToast.error('Failed to load data', error.data?.message || error.message)
      setDepartments([])
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  // Filter departments based on search term
  const filteredDepartments = useMemo(() => {
    if (!Array.isArray(departments)) return []
    if (!searchTerm) return departments
    
    const searchLower = searchTerm.toLowerCase()
    
    return departments.filter(dept => {
      if (!dept) return false
      
      const deptName = dept.name?.toLowerCase() || ''
      const deptDescription = dept.description?.toLowerCase() || ''
      const contactEmail = dept.contactEmail?.toLowerCase() || ''
      const hodName = `${dept.head?.user?.firstName || ''} ${dept.head?.user?.lastName || ''}`.toLowerCase()
      
      return (
        deptName.includes(searchLower) ||
        deptDescription.includes(searchLower) ||
        contactEmail.includes(searchLower) ||
        hodName.includes(searchLower)
      )
    })
  }, [departments, searchTerm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const deptData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        contactEmail: formData.contactEmail.trim(),
        budget: formData.budget ? parseFloat(formData.budget) : 0
      }

      // Only include head if it's selected (not empty string)
      if (formData.head && formData.head.trim() !== '') {
        deptData.head = formData.head
      }

      console.log('💾 Departments - Saving department:', editingDept ? 'update' : 'create', deptData)

      if (editingDept) {
        await adminApi.updateDepartment(editingDept._id, deptData)
        showToast.success('Department updated successfully')
      } else {
        await adminApi.createDepartment(deptData)
        showToast.success('Department created successfully')
      }
      
      await fetchData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Departments - Error saving department:', error)
      setError('Failed to save department. Please try again.')
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (deptId) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        console.log('🗑️ Departments - Deleting department:', deptId)
        await adminApi.deleteDepartment(deptId)
        showToast.success('Department deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Departments - Error deleting department:', error)
        setError('Failed to delete department. Please try again.')
        showToast.error('Failed to delete department', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      head: '',
      description: '',
      contactEmail: '',
      budget: ''
    })
    setEditingDept(null)
  }

  const openCreateModal = () => {
    console.log('➕ Departments - Opening create modal')
    resetForm()
    setIsModalOpen(true)
  }

  // Calculate stats safely
  const totalDepartments = departments.length || 0
  const totalStaff = Array.isArray(departments)
    ? departments.reduce((total, dept) => total + (dept.staffCount || 0), 0)
    : 0
  const totalBudget = Array.isArray(departments)
    ? departments.reduce((total, dept) => total + (dept.budget || 0), 0)
    : 0
  const averageStaff = totalDepartments > 0
    ? (totalStaff / totalDepartments).toFixed(1)
    : '0.0'

  // Display departments - filtered if search is active
  const displayDepartments = filteredDepartments

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Departments Management</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredDepartments.length} of {departments.length} departments
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              'Manage school departments and leadership'
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
            Add Department
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
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredDepartments.length} results
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-800 font-bold px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold">{totalDepartments}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold">{totalStaff}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold">
                KES {totalBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Average Staff</p>
              <p className="text-2xl font-bold">{averageStaff}</p>
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
            placeholder="Search departments by name, description, email, or HoD name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Departments Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading departments...</p>
          </div>
        ) : !Array.isArray(displayDepartments) || displayDepartments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Building className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No departments found' : 'No departments yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No departments found for "${searchTerm}". Try a different search term.`
                : 'Get started by creating your first department'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create First Department
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
            {displayDepartments.map((dept) => {
              const hodName = dept.head 
                ? `${dept.head.user?.firstName || ''} ${dept.head.user?.lastName || ''}`.trim()
                : 'No HoD assigned'
              const hodPosition = dept.head?.position || ''
              
              return (
                <div key={dept._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{dept.name}</h3>
                          <p className="text-sm text-gray-600 truncate">
                            {dept.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => {
                          setEditingDept(dept)
                          setFormData({
                            name: dept.name || '',
                            head: dept.head?._id || '',
                            description: dept.description || '',
                            contactEmail: dept.contactEmail || '',
                            budget: dept.budget?.toString() || ''
                          })
                          setIsModalOpen(true)
                        }} 
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(dept._id)} 
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span><strong>Head of Department:</strong> {hodName}</span>
                    </div>
                    
                    {hodPosition && (
                      <div className="flex items-center gap-2">
                        <span><strong>HoD Position:</strong> {hodPosition}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span><strong>Staff Members:</strong> {dept.staffCount || 0}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span><strong>Annual Budget:</strong> KES {(dept.budget || 0).toLocaleString()}</span>
                    </div>
                    
                    {dept.contactEmail && (
                      <div className="flex items-center gap-2">
                        <span><strong>Contact:</strong> {dept.contactEmail}</span>
                      </div>
                    )}
                  </div>
                  
                  {dept.createdAt && (
                    <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                      Created: {new Date(dept.createdAt).toLocaleDateString('en-US', {
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingDept(null)
          resetForm()
        }}
        closeOnBackdropClick={false}
        title={editingDept ? 'Edit Department' : 'Add New Department'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name *"
            required
            placeholder="e.g., Mathematics Department"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Head of Department (Optional)
            </label>
            <select
              value={formData.head}
              onChange={(e) => setFormData({...formData, head: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select HoD (Optional)</option>
              {Array.isArray(staff) && staff.map(staffMember => (
                <option key={staffMember._id} value={staffMember._id}>
                  {staffMember.user?.firstName || 'Unknown'} {staffMember.user?.lastName || ''} - {staffMember.position || 'Staff'}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Contact Email"
            type="email"
            placeholder="department@school.com"
            value={formData.contactEmail}
            onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Annual Budget (KES)"
              type="number"
              min="0"
              placeholder="Budget amount"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the department..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingDept(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingDept ? 'Update Department' : 'Add Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Departments