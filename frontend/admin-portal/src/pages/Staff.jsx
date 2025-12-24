import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Briefcase, User, Mail, Phone, Edit, Trash2, RefreshCw, GraduationCap, BookOpen, Award, Calendar, DollarSign, Building } from 'lucide-react'
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
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  
  // Form data matching backend schema
  const [formData, setFormData] = useState({
    user: '', // User ObjectId (required)
    employeeId: '',
    position: '',
    department: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
    qualifications: [],
    subjects: []
  })

  // Temporary qualification input
  const [qualificationInput, setQualificationInput] = useState('')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [staffRes, deptRes, usersRes, coursesRes] = await Promise.all([
        adminApi.getStaff(),
        adminApi.getDepartments(),
        adminApi.getUsers({ role: 'staff' }),
        adminApi.getCourses()
      ])
      
      console.log('📦 Staff API Response:', staffRes)
      console.log('📦 Departments API Response:', deptRes)
      console.log('📦 Users API Response:', usersRes)
      console.log('📦 Courses API Response:', coursesRes)
      
      // Helper function to extract data
      const extractData = (response, dataType) => {
        console.log(`🔍 Extracting ${dataType} from:`, response)
        
        if (Array.isArray(response)) {
          console.log(`✅ ${dataType}: Direct array, length:`, response.length)
          return response
        }
        
        if (response && response.success && response.data) {
          const { data } = response
          
          if (Array.isArray(data)) {
            console.log(`✅ ${dataType}: response.data array, length:`, data.length)
            return data
          }
          
          if (data && typeof data === 'object') {
            // Try plural key first
            const pluralKey = dataType.toLowerCase() + 's'
            if (Array.isArray(data[pluralKey])) {
              console.log(`✅ ${dataType}: Found in data.${pluralKey}, length:`, data[pluralKey].length)
              return data[pluralKey]
            }
            
            // Try singular key
            if (Array.isArray(data[dataType.toLowerCase()])) {
              console.log(`✅ ${dataType}: Found in data.${dataType.toLowerCase()}, length:`, data[dataType.toLowerCase()].length)
              return data[dataType.toLowerCase()]
            }
            
            // Try to extract any array from the data object
            for (const key in data) {
              if (Array.isArray(data[key])) {
                console.log(`✅ ${dataType}: Found array in data.${key}, length:`, data[key].length)
                return data[key]
              }
            }
          }
        }
        
        // Response has direct property with array
        const pluralKey = dataType.toLowerCase() + 's'
        if (response && Array.isArray(response[pluralKey])) {
          console.log(`✅ ${dataType}: Direct property response.${pluralKey}, length:`, response[pluralKey].length)
          return response[pluralKey]
        }
        
        console.warn(`⚠️ ${dataType}: Could not extract data, returning empty array`)
        return []
      }

      // Extract data from each response
      const staffData = extractData(staffRes, 'staff')
      const departmentsData = extractData(deptRes, 'department')
      const usersData = extractData(usersRes, 'user')
      const coursesData = extractData(coursesRes, 'course')
      
      console.log('✅ FINAL Staff Data:', staffData)
      console.log('✅ FINAL Departments Data:', departmentsData)
      console.log('✅ FINAL Users Data:', usersData)
      console.log('✅ FINAL Courses Data:', coursesData)
      
      setStaff(staffData)
      setDepartments(departmentsData)
      setUsers(usersData)
      setCourses(coursesData)
      
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      showToast.error('Failed to load data', error.data?.message || error.message)
      setStaff([])
      setDepartments([])
      setUsers([])
      setCourses([])
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
      const departmentName = staffMember.department?.name?.toLowerCase() || ''
      
      return (
        staffName.includes(searchLower) ||
        staffEmail.includes(searchLower) ||
        staffPosition.includes(searchLower) ||
        staffEmployeeId.includes(searchLower) ||
        departmentName.includes(searchLower)
      )
    })
  }, [staff, searchTerm])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const addQualification = () => {
    if (qualificationInput.trim() && !formData.qualifications.includes(qualificationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qualificationInput.trim()]
      }))
      setQualificationInput('')
    }
  }

  const removeQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }))
  }

  const handleSubjectsChange = (e) => {
    const options = e.target.options
    const selectedValues = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value)
      }
    }
    setFormData(prev => ({ ...prev, subjects: selectedValues }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Prepare data matching backend schema
      const staffData = {
        user: formData.user,
        employeeId: formData.employeeId.trim(),
        position: formData.position,
        department: formData.department || undefined,
        hireDate: formData.hireDate,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        qualifications: formData.qualifications,
        subjects: formData.subjects
      }

      console.log('💾 Saving staff:', editingStaff ? 'UPDATE' : 'CREATE', staffData)

      if (editingStaff) {
        await adminApi.updateStaff(editingStaff._id, staffData)
        showToast.success('Staff updated successfully')
      } else {
        await adminApi.createStaff(staffData)
        showToast.success('Staff created successfully')
      }
      
      await fetchAllData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Error saving staff:', error)
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (staffMember) => {
    console.log('✏️ Editing staff:', staffMember._id)
    setEditingStaff(staffMember)
    
    setFormData({
      user: staffMember.user?._id || staffMember.user || '',
      employeeId: staffMember.employeeId || '',
      position: staffMember.position || '',
      department: staffMember.department?._id || staffMember.department || '',
      hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      salary: staffMember.salary?.toString() || '',
      qualifications: staffMember.qualifications || [],
      subjects: staffMember.subjects ? staffMember.subjects.map(s => s._id || s) : []
    })
    
    setIsModalOpen(true)
  }

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        console.log('🗑️ Deleting staff:', staffId)
        await adminApi.deleteStaff(staffId)
        showToast.success('Staff deleted successfully')
        fetchAllData()
      } catch (error) {
        console.error('❌ Error deleting staff:', error)
        showToast.error('Failed to delete staff', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      user: '',
      employeeId: '',
      position: '',
      department: '',
      hireDate: new Date().toISOString().split('T')[0],
      salary: '',
      qualifications: [],
      subjects: []
    })
    setQualificationInput('')
    setEditingStaff(null)
  }

  const openCreateModal = () => {
    console.log('➕ Opening create staff modal')
    resetForm()
    setIsModalOpen(true)
  }

  const getPositionColor = (position) => {
    if (!position) return 'default'
    
    const posLower = position.toLowerCase()
    if (posLower.includes('teacher') || posLower.includes('lecturer')) return 'success'
    if (posLower.includes('admin') || posLower.includes('principal') || posLower.includes('head')) return 'warning'
    if (posLower.includes('driver') || posLower.includes('cleaner') || posLower.includes('security') || posLower.includes('custodian')) return 'info'
    return 'default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  // Calculate stats safely
  const totalStaff = staff.length || 0
  const teachersCount = Array.isArray(staff) 
    ? staff.filter(s => {
        const pos = s.position?.toLowerCase()
        return pos && (pos.includes('teacher') || pos.includes('lecturer') || pos.includes('tutor'))
      }).length
    : 0
  const adminCount = Array.isArray(staff)
    ? staff.filter(s => {
        const pos = s.position?.toLowerCase()
        return pos && (pos.includes('admin') || pos.includes('principal') || pos.includes('head') || 
                      pos.includes('secretary') || pos.includes('accountant') || pos.includes('manager'))
      }).length
    : 0
  const supportCount = Array.isArray(staff)
    ? staff.filter(s => {
        const pos = s.position?.toLowerCase()
        return pos && (pos.includes('driver') || pos.includes('cleaner') || 
                      pos.includes('security') || pos.includes('custodian') || 
                      pos.includes('cook') || pos.includes('nurse'))
      }).length
    : 0

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
            onClick={fetchAllData}
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
        <Card className="p-4">
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
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Teaching Staff</p>
              <p className="text-2xl font-bold">{teachersCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
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
        <Card className="p-4">
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
            {displayStaff.map((staffMember) => (
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
                      onClick={() => handleEdit(staffMember)} 
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
                    <Badge variant={getPositionColor(staffMember.position)}>
                      {staffMember.position || 'Not specified'}
                    </Badge>
                  </div>
                  
                  {staffMember.department && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span><strong>Department:</strong> {staffMember.department.name || 'Not specified'}</span>
                    </div>
                  )}
                  
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
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span><strong>Hire Date:</strong> {formatDate(staffMember.hireDate)}</span>
                  </div>
                  
                  {staffMember.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span><strong>Salary:</strong> {formatCurrency(staffMember.salary)}</span>
                    </div>
                  )}
                  
                  {staffMember.qualifications && staffMember.qualifications.length > 0 && (
                    <div className="flex items-start gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-xs">
                        <strong>Qualifications:</strong> {staffMember.qualifications.slice(0, 2).join(', ')}
                        {staffMember.qualifications.length > 2 && ` +${staffMember.qualifications.length - 2} more`}
                      </span>
                    </div>
                  )}
                  
                  {staffMember.subjects && staffMember.subjects.length > 0 && (
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-xs">
                        <strong>Subjects:</strong> {staffMember.subjects.slice(0, 2).map(s => s.name || s).join(', ')}
                        {staffMember.subjects.length > 2 && ` +${staffMember.subjects.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
                
                {staffMember.createdAt && (
                  <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                    Added: {formatDate(staffMember.createdAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('🟢 Staff modal onClose triggered')
          setIsModalOpen(false)
          setEditingStaff(null)
          resetForm()
        }}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection (only for new staff) */}
          {!editingStaff && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User Account *
              </label>
              <select
                name="user"
                value={formData.user}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select user account...</option>
                {Array.isArray(users) && users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.profile?.firstName || ''} {user.profile?.lastName || ''} 
                    {user.email && ` (${user.email})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                User must have "staff" role. Create user in Users section first.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Employee ID *"
              name="employeeId"
              required
              placeholder="e.g., EMP001"
              value={formData.employeeId}
              onChange={handleInputChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <select
                name="position"
                required
                value={formData.position}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select position</option>
                {STAFF_POSITIONS && STAFF_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select department</option>
                {Array.isArray(departments) && departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Hire Date"
              name="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={handleInputChange}
            />
          </div>

          <Input
            label="Salary (KES)"
            name="salary"
            type="number"
            placeholder="Monthly salary"
            value={formData.salary}
            onChange={handleInputChange}
          />

          {/* Qualifications */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Qualifications</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add qualification (e.g., BSc Computer Science)"
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addQualification}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {formData.qualifications.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No qualifications added</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.qualifications.map((qual, index) => (
                  <Badge key={index} variant="info" className="flex items-center gap-1">
                    {qual}
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Subjects (for teachers) */}
          {(formData.position?.toLowerCase().includes('teacher') || 
            formData.position?.toLowerCase().includes('lecturer') ||
            editingStaff?.position?.toLowerCase().includes('teacher') ||
            editingStaff?.position?.toLowerCase().includes('lecturer')) && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Subjects
              </label>
              <select
                multiple
                value={formData.subjects}
                onChange={handleSubjectsChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              >
                {Array.isArray(courses) && courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                    {course.code && ` (${course.code})`}
                    {course.grade && ` - Grade ${course.grade}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple subjects
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                console.log('🔘 Cancel button clicked')
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