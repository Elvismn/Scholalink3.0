import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Briefcase, User, Mail, Phone, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button, Modal, Input, Card, showToast, Loader } from '@shared'
import { STAFF_POSITIONS } from '@shared'
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

const Staff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [departments, setDepartments] = useState([])
  const [formData, setFormData] = useState({
    employeeId: '',
    position: '',
    department: '',
    hireDate: '',
    salary: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [staffRes, deptRes] = await Promise.all([
        adminApi.getStaff(),
        adminApi.getDepartments()
      ])
      
      console.log('Staff API Response:', staffRes)
      console.log('Departments API Response:', deptRes)
      
      // Handle staff response - check different response formats
      let staffData = []
      if (staffRes) {
        if (Array.isArray(staffRes)) {
          staffData = staffRes
        } else if (staffRes.data && Array.isArray(staffRes.data)) {
          staffData = staffRes.data
        } else if (staffRes.staff && Array.isArray(staffRes.staff)) {
          staffData = staffRes.staff
        } else if (typeof staffRes === 'object') {
          // If it's an object, check for any array properties
          const arrayProps = Object.values(staffRes).filter(Array.isArray)
          if (arrayProps.length > 0) {
            staffData = arrayProps[0] // Use the first array found
          }
        }
      }
      setStaff(staffData || [])
      
      // Handle departments response
      let departmentsData = []
      if (deptRes) {
        if (Array.isArray(deptRes)) {
          departmentsData = deptRes
        } else if (deptRes.data && Array.isArray(deptRes.data)) {
          departmentsData = deptRes.data
        } else if (deptRes.departments && Array.isArray(deptRes.departments)) {
          departmentsData = deptRes.departments
        }
      }
      setDepartments(departmentsData || [])
      
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      showToast.error('Failed to load data', error.data?.message || error.message)
      setStaff([])
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  // Filter staff based on search term
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staff)) return []
    if (!searchTerm) return staff
    
    const searchLower = searchTerm.toLowerCase()
    
    return staff.filter(staffMember => {
      if (!staffMember) return false
      
      const staffName = `${staffMember.user?.firstName || ''} ${staffMember.user?.lastName || ''}`.toLowerCase()
      const staffEmail = staffMember.user?.email?.toLowerCase() || ''
      const staffPosition = staffMember.position?.toLowerCase() || ''
      const staffEmployeeId = staffMember.employeeId?.toLowerCase() || ''
      
      return (
        staffName.includes(searchLower) ||
        staffEmail.includes(searchLower) ||
        staffPosition.includes(searchLower) ||
        staffEmployeeId.includes(searchLower)
      )
    })
  }, [staff, searchTerm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const staffData = {
        employeeId: formData.employeeId.trim(),
        position: formData.position,
        department: formData.department,
        hireDate: formData.hireDate,
        salary: formData.salary ? parseFloat(formData.salary) : 0
      }

      console.log('💾 Saving staff:', editingStaff ? 'update' : 'create')

      if (editingStaff) {
        await adminApi.updateStaff(editingStaff._id, staffData)
        showToast.success('Staff updated successfully')
      } else {
        showToast.info('Note: Staff creation requires a user account first')
        // In production, you'd create a user first then staff
        setIsModalOpen(false)
        setEditingStaff(null)
      }
      
      await fetchData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Error saving staff:', error)
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        console.log('🗑️ Deleting staff:', staffId)
        await adminApi.deleteStaff(staffId)
        showToast.success('Staff deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Error deleting staff:', error)
        showToast.error('Failed to delete staff', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      position: '',
      department: '',
      hireDate: '',
      salary: ''
    })
    setEditingStaff(null)
  }

  const openCreateModal = () => {
    console.log('➕ Opening create modal')
    resetForm()
    setIsModalOpen(true)
  }

  // Calculate stats safely
  const totalStaff = staff.length || 0
  const teachersCount = Array.isArray(staff) 
    ? staff.filter(s => s.position?.toLowerCase().includes('teacher')).length
    : 0
  const adminCount = Array.isArray(staff)
    ? staff.filter(s => 
        s.position?.toLowerCase().includes('admin') || 
        s.position?.toLowerCase().includes('secretary') ||
        s.position?.toLowerCase().includes('accountant')
      ).length
    : 0
  const supportCount = Array.isArray(staff)
    ? staff.filter(s => 
        s.position?.toLowerCase().includes('driver') || 
        s.position?.toLowerCase().includes('cleaner') ||
        s.position?.toLowerCase().includes('security')
      ).length
    : 0

  // Display staff - filtered if search is active
  const displayStaff = filteredStaff

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredStaff.length} of {staff.length} staff members
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              'Manage school staff and personnel'
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
            Add Staff
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
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredStaff.length} results
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold">{totalStaff}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Teachers</p>
              <p className="text-2xl font-bold">{teachersCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Administrative</p>
              <p className="text-2xl font-bold">{adminCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Support Staff</p>
              <p className="text-2xl font-bold">{supportCount}</p>
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
            placeholder="Search staff by name, position, email, or employee ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Staff Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading staff...</p>
          </div>
        ) : !Array.isArray(displayStaff) || displayStaff.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Briefcase className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No staff members found' : 'No staff members yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No staff members found for "${searchTerm}". Try a different search term.`
                : 'Get started by adding your first staff member'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Staff
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
            {displayStaff.map((staffMember) => {
              const departmentName = staffMember.department?.name || 'No department'
              const formattedHireDate = staffMember.hireDate 
                ? new Date(staffMember.hireDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Not specified'
              
              return (
                <div key={staffMember._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {staffMember.user?.firstName || 'Unknown'} {staffMember.user?.lastName || ''}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">ID: {staffMember.employeeId || 'No ID'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => {
                          setEditingStaff(staffMember)
                          setFormData({
                            employeeId: staffMember.employeeId || '',
                            position: staffMember.position || '',
                            department: staffMember.department?._id || '',
                            hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : '',
                            salary: staffMember.salary?.toString() || ''
                          })
                          setIsModalOpen(true)
                        }} 
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(staffMember._id)} 
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Position:</span>
                      <Badge 
                        variant={
                          staffMember.position?.toLowerCase().includes('teacher') ? 'success' :
                          staffMember.position?.toLowerCase().includes('admin') ? 'warning' :
                          staffMember.position?.toLowerCase().includes('driver') || 
                          staffMember.position?.toLowerCase().includes('cleaner') || 
                          staffMember.position?.toLowerCase().includes('security') ? 'info' : 'default'
                        }
                      >
                        {staffMember.position || 'Not specified'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span><strong>Department:</strong> {departmentName}</span>
                    </div>
                    
                    {staffMember.user?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{staffMember.user.email}</span>
                      </div>
                    )}
                    
                    {staffMember.user?.profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{staffMember.user.profile.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span><strong>Hire Date:</strong> {formattedHireDate}</span>
                    </div>
                    
                    {staffMember.salary && (
                      <div className="flex items-center gap-2">
                        <span><strong>Salary:</strong> KES {parseFloat(staffMember.salary).toLocaleString()}/month</span>
                      </div>
                    )}
                  </div>
                  
                  {staffMember.createdAt && (
                    <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                      Added: {new Date(staffMember.createdAt).toLocaleDateString('en-US', {
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

      {/* Add/Edit Modal - FIXED with closeOnBackdropClick={false} */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingStaff(null)
          resetForm()
        }}
        closeOnBackdropClick={false}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Employee ID *"
            required
            placeholder="e.g., EMP001"
            value={formData.employeeId}
            onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position *
            </label>
            <select
              required
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select position</option>
              {STAFF_POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hire Date"
              type="date"
              value={formData.hireDate}
              onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
            />
            <Input
              label="Salary"
              type="number"
              placeholder="Monthly salary"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
            />
          </div>

          {!editingStaff && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Staff members require a user account first. 
                Please create the user account in the Users section before adding staff details.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingStaff(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Staff