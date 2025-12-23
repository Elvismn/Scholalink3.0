import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, RefreshCw, Edit, Trash2, Eye, User, Mail, Phone, MapPin, Calendar, Users, Bug } from 'lucide-react'
import { Button, Modal, Input, Card, showToast, Loader } from '@shared'
import { STUDENT_STATUS, GRADE_LEVELS } from '@shared'
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

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')
  
  // Additional data needed
  const [parents, setParents] = useState([])
  const [classrooms, setClassrooms] = useState([])
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  
  // Student states
  const [editingStudent, setEditingStudent] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Form data matching backend schema
  const [formData, setFormData] = useState({
    // Basic Information (matches backend)
    firstName: '',
    lastName: '',
    studentId: '',
    grade: '',
    dateOfBirth: '',
    gender: 'Male',
    
    // Relationships (matches backend)
    parents: [], // Array of parent IDs
    classroom: '', // Single classroom ID
    
    // Contact
    address: '',
    
    // Emergency Contact (object as per backend)
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    
    medicalInfo: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [studentsRes, parentsRes, classroomsRes] = await Promise.all([
        adminApi.getStudents(),
        adminApi.getParents(),
        adminApi.getClassrooms()
      ])
      
      console.log('📦 RAW Students API Response:', studentsRes)
      console.log('📦 RAW Parents API Response:', parentsRes)
      console.log('📦 RAW Classrooms API Response:', classroomsRes)
      
      // Helper function to extract data from various response structures
      const extractData = (response, dataType) => {
        console.log(`🔍 Extracting ${dataType} from:`, response)
        
        // Case 1: Direct array
        if (Array.isArray(response)) {
          console.log(`✅ ${dataType}: Direct array, length:`, response.length)
          return response
        }
        
        // Case 2: { success: true, data: {...} }
        if (response && response.success && response.data) {
          const { data } = response
          
          // Case 2a: data is an array
          if (Array.isArray(data)) {
            console.log(`✅ ${dataType}: response.data array, length:`, data.length)
            return data
          }
          
          // Case 2b: data is an object with a key matching dataType
          if (data && typeof data === 'object') {
            // Try plural key first (students, parents, classrooms)
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
            
            // Try 'items' or 'results'
            if (Array.isArray(data.items)) {
              console.log(`✅ ${dataType}: Found in data.items, length:`, data.items.length)
              return data.items
            }
            if (Array.isArray(data.results)) {
              console.log(`✅ ${dataType}: Found in data.results, length:`, data.results.length)
              return data.results
            }
            
            // Try to extract any array from the data object
            for (const key in data) {
              if (Array.isArray(data[key])) {
                console.log(`✅ ${dataType}: Found array in data.${key}, length:`, data[key].length)
                return data[key]
              }
            }
            
            // If data is an object with an _id, wrap in array
            if (data._id) {
              console.log(`✅ ${dataType}: Single object, wrapping in array`)
              return [data]
            }
            
            // Last resort: convert object values to array
            const values = Object.values(data)
            if (values.length > 0 && values.some(v => v && typeof v === 'object')) {
              console.log(`✅ ${dataType}: Converting object values to array, length:`, values.length)
              return values
            }
          }
        }
        
        // Case 3: Response has direct property with array
        const pluralKey = dataType.toLowerCase() + 's'
        if (response && Array.isArray(response[pluralKey])) {
          console.log(`✅ ${dataType}: Direct property response.${pluralKey}, length:`, response[pluralKey].length)
          return response[pluralKey]
        }
        
        // Case 4: Try to find any array in the response
        if (response && typeof response === 'object') {
          for (const key in response) {
            if (Array.isArray(response[key])) {
              console.log(`✅ ${dataType}: Found array in response.${key}, length:`, response[key].length)
              return response[key]
            }
          }
        }
        
        console.warn(`⚠️ ${dataType}: Could not extract data, returning empty array`)
        console.log('Response structure was:', JSON.stringify(response, null, 2))
        return []
      }

      // Extract data from each response
      const studentsData = extractData(studentsRes, 'student')
      const parentsData = extractData(parentsRes, 'parent')
      const classroomsData = extractData(classroomsRes, 'classroom')
      
      console.log('✅ FINAL Students Data:', studentsData)
      console.log('✅ FINAL Parents Data:', parentsData)
      console.log('✅ FINAL Classrooms Data:', classroomsData)
      
      setStudents(studentsData)
      setParents(parentsData)
      setClassrooms(classroomsData)
      
      // If no students found but API succeeded, check backend
      if (studentsData.length === 0 && studentsRes.success) {
        console.log('ℹ️ API succeeded but no students found. Possible issues:')
        console.log('1. No students in database')
        console.log('2. Backend returns empty array')
        console.log('3. Response structure different than expected')
      }
      
      setError('')
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      setError('Failed to load data. Please check your connection and try again.')
      showToast.error('Failed to load data', error.data?.message || error.message)
      setStudents([])
      setParents([])
      setClassrooms([])
    } finally {
      setLoading(false)
    }
  }

  // Filter students based on search term and status
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return []
    if (!searchTerm && statusFilter === 'all') return students
    
    const searchLower = searchTerm.toLowerCase()
    
    return students.filter(student => {
      if (!student) return false
      
      // Search filter
      const matchesSearch = searchTerm ? (
        (student.firstName?.toLowerCase().includes(searchLower)) ||
        (student.lastName?.toLowerCase().includes(searchLower)) ||
        (student.grade?.toLowerCase().includes(searchLower)) ||
        (student.studentId?.toLowerCase().includes(searchLower)) ||
        (student.email?.toLowerCase().includes(searchLower)) ||
        (student.parentNames?.toLowerCase().includes(searchLower))
      ) : true
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [students, searchTerm, statusFilter])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value
      }
    }))
  }

  const handleParentSelection = (e) => {
    const options = e.target.options
    const selectedValues = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value)
      }
    }
    setFormData(prev => ({ ...prev, parents: selectedValues }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Prepare data matching backend schema
      const studentData = {
        // Basic Information
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        studentId: formData.studentId.trim(),
        grade: formData.grade,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        
        // Relationships
        parents: formData.parents, // Array of parent IDs
        classroom: formData.classroom || undefined, // Optional classroom ID
        
        // Contact
        address: formData.address.trim(),
        
        // Emergency Contact (object)
        emergencyContact: {
          name: formData.emergencyContact.name.trim(),
          phone: formData.emergencyContact.phone.trim(),
          relationship: formData.emergencyContact.relationship.trim()
        },
        
        medicalInfo: formData.medicalInfo.trim(),
        status: formData.status
      }

      console.log('💾 Saving student:', editingStudent ? 'UPDATE' : 'CREATE', studentData)

      if (editingStudent) {
        await adminApi.updateStudent(editingStudent._id, studentData)
        showToast.success('Student updated successfully')
      } else {
        await adminApi.createStudent(studentData)
        showToast.success('Student created successfully')
      }
      
      await fetchAllData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Error saving student:', error)
      setError('Failed to save student. Please try again.')
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (student) => {
    console.log('✏️ Editing student:', student._id)
    setEditingStudent(student)
    
    // Populate form from student data (matching backend schema)
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      studentId: student.studentId || '',
      grade: student.grade || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      gender: student.gender || 'Male',
      parents: student.parents ? student.parents.map(p => p._id || p) : [],
      classroom: student.classroom?._id || student.classroom || '',
      address: student.address || '',
      emergencyContact: student.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      },
      medicalInfo: student.medicalInfo || '',
      status: student.status || 'Active'
    })
    
    setIsModalOpen(true)
  }

  const handleView = (student) => {
    setSelectedStudent(student)
    setViewModalOpen(true)
  }

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        console.log('🗑️ Deleting student:', studentId)
        await adminApi.deleteStudent(studentId)
        showToast.success('Student deleted successfully')
        fetchAllData()
      } catch (error) {
        console.error('❌ Error deleting student:', error)
        setError('Failed to delete student. Please try again.')
        showToast.error('Failed to delete student', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      studentId: '',
      grade: '',
      dateOfBirth: '',
      gender: 'Male',
      parents: [],
      classroom: '',
      address: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      medicalInfo: '',
      status: 'Active'
    })
    setEditingStudent(null)
  }

  const openCreateModal = () => {
    console.log('➕ Opening create student modal')
    resetForm()
    setIsModalOpen(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-red-100 text-red-800'
      case 'Graduated': return 'bg-purple-100 text-purple-800'
      case 'Transferred': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return ''
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper to get parent names for display
  const getParentNames = (student) => {
    if (!student.parents || !Array.isArray(student.parents)) return 'No parents'
    
    const parentNames = student.parents.map(parent => {
      if (typeof parent === 'object') {
        return `${parent.user?.firstName || ''} ${parent.user?.lastName || ''}`.trim()
      }
      return 'Unknown Parent'
    })
    
    return parentNames.filter(name => name).join(', ') || 'No parents'
  }

  // Helper to get classroom name for display
  const getClassName = (student) => {
    if (!student.classroom) return 'Not assigned'
    if (typeof student.classroom === 'object') {
      return student.classroom.name || 'Unnamed Class'
    }
    return 'Classroom ID: ' + student.classroom
  }

  // Display students - filtered if search is active
  const displayStudents = filteredStudents

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredStudents.length} of {students.length} students
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              'Manage student information and records'
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
          
          {/* Debug API Button */}
          <Button
            variant="warning"
            onClick={async () => {
              console.log('🔍 DEBUG: Checking API responses...')
              try {
                const testRes = await adminApi.getStudents()
                console.log('🔍 DEBUG: Raw students response:', testRes)
                console.log('🔍 DEBUG: Response keys:', Object.keys(testRes))
                console.log('🔍 DEBUG: Response.data keys:', testRes.data ? Object.keys(testRes.data) : 'No data')
                console.log('🔍 DEBUG: Full response structure:')
                console.dir(testRes, { depth: 5 })
                
                // Try to manually find students
                if (testRes.data) {
                  const allKeys = Object.keys(testRes.data)
                  console.log('🔍 DEBUG: Searching data object keys:', allKeys)
                  allKeys.forEach(key => {
                    const value = testRes.data[key]
                    console.log(`🔍 DEBUG: data.${key}:`, Array.isArray(value) ? `Array (${value.length} items)` : typeof value)
                    if (Array.isArray(value)) {
                      console.log(`🔍 DEBUG: First item of ${key}:`, value[0])
                    }
                  })
                  
                  // Deep search for arrays
                  const deepSearch = (obj, path = '') => {
                    if (Array.isArray(obj)) {
                      console.log(`🔍 DEBUG: Found array at ${path}, length:`, obj.length)
                      if (obj.length > 0) {
                        console.log(`🔍 DEBUG: First array item:`, obj[0])
                      }
                    } else if (obj && typeof obj === 'object') {
                      for (const key in obj) {
                        deepSearch(obj[key], path ? `${path}.${key}` : key)
                      }
                    }
                  }
                  
                  deepSearch(testRes.data, 'data')
                }
              } catch (error) {
                console.error('🔍 DEBUG: Error testing API:', error)
              }
            }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Bug className="w-4 h-4" />
            Debug API
          </Button>
          
          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
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
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredStudents.length} results
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

      {/* Search and Filter Card */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students by name, grade, email, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Graduated">Graduated</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Students Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        ) : !Array.isArray(displayStudents) || displayStudents.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No students found' : 'No students yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No students found for "${searchTerm}". Try a different search term.`
                : 'Get started by adding your first student'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Student
              </Button>
            )}
            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayStudents.map((student) => (
              <div key={student._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">ID: {student.studentId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0 ml-2">
                    <button 
                      onClick={() => handleView(student)} 
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(student)} 
                      className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(student._id)} 
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Grade:</span>
                    <span>{student.grade}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="truncate">Class: {getClassName(student)}</span>
                  </div>
                  
                  {student.dateOfBirth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Age: {calculateAge(student.dateOfBirth)}</span>
                    </div>
                  )}
                  
                  {student.gender && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{student.gender}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="truncate">Parents: {getParentNames(student)}</span>
                  </div>
                  
                  {student.emergencyContact?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-xs truncate">
                        Emergency: {student.emergencyContact.phone}
                        {student.emergencyContact.name && ` (${student.emergencyContact.name})`}
                      </span>
                    </div>
                  )}
                </div>
                
                {student.createdAt && (
                  <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                    Created: {formatDate(student.createdAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('🟢 Student modal onClose triggered')
          setIsModalOpen(false)
          setEditingStudent(null)
          resetForm()
        }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name *"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter last name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Student ID *"
              name="studentId"
              required
              value={formData.studentId}
              onChange={handleInputChange}
              placeholder="e.g., STU001"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
              <select
                name="grade"
                required
                value={formData.grade}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Grade</option>
                {GRADE_LEVELS && GRADE_LEVELS.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date of Birth *"
              name="dateOfBirth"
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={handleInputChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Relationships */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parents *</label>
              <select
                multiple
                value={formData.parents}
                onChange={handleParentSelection}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                required
              >
                <option value="" disabled>Select parent(s)</option>
                {Array.isArray(parents) && parents.map(parent => (
                  <option key={parent._id} value={parent._id}>
                    {parent.user?.firstName || 'Unknown'} {parent.user?.lastName || ''}
                    {parent.user?.email && ` (${parent.user.email})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple parents
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classroom</label>
              <select
                name="classroom"
                value={formData.classroom}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Classroom (Optional)</option>
                {Array.isArray(classrooms) && classrooms.map(classroom => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name || `Class ${classroom._id.substring(0, 8)}`}
                    {classroom.grade && ` - ${classroom.grade}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Home address"
          />

          {/* Emergency Contact */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Contact Name"
                name="name"
                value={formData.emergencyContact.name}
                onChange={handleEmergencyContactChange}
                placeholder="Emergency contact name"
              />
              <Input
                label="Phone"
                name="phone"
                value={formData.emergencyContact.phone}
                onChange={handleEmergencyContactChange}
                placeholder="Emergency phone"
              />
              <Input
                label="Relationship"
                name="relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleEmergencyContactChange}
                placeholder="Relationship to student"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Information</label>
              <textarea
                name="medicalInfo"
                value={formData.medicalInfo}
                onChange={handleInputChange}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Allergies, conditions, special needs..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STUDENT_STATUS && Object.entries(STUDENT_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                console.log('🔘 Cancel button clicked')
                setIsModalOpen(false)
                setEditingStudent(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Student Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          console.log('👁️ View modal onClose triggered')
          setViewModalOpen(false)
        }}
        title="Student Details"
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-gray-600">ID: {selectedStudent.studentId}</p>
                <Badge 
                  className="mt-2"
                  variant={
                    selectedStudent.status === 'Active' ? 'success' :
                    selectedStudent.status === 'Inactive' ? 'error' :
                    selectedStudent.status === 'Graduated' ? 'warning' : 'info'
                  }
                >
                  {selectedStudent.status}
                </Badge>
              </div>
            </div>

            {/* Student Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Personal Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span><strong>Age:</strong> {calculateAge(selectedStudent.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span><strong>Gender:</strong> {selectedStudent.gender || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span><strong>Date of Birth:</strong> {formatDate(selectedStudent.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span><strong>Grade:</strong> {selectedStudent.grade || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span><strong>Class:</strong> {getClassName(selectedStudent)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedStudent.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span><strong>Address:</strong> {selectedStudent.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Parent/Guardian Information</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Parents:</strong> {getParentNames(selectedStudent)}
                    </div>
                    {selectedStudent.emergencyContact && (
                      <>
                        {selectedStudent.emergencyContact.name && (
                          <div>
                            <strong>Emergency Contact:</strong> {selectedStudent.emergencyContact.name}
                          </div>
                        )}
                        {selectedStudent.emergencyContact.phone && (
                          <div>
                            <strong>Emergency Phone:</strong> {selectedStudent.emergencyContact.phone}
                          </div>
                        )}
                        {selectedStudent.emergencyContact.relationship && (
                          <div>
                            <strong>Relationship:</strong> {selectedStudent.emergencyContact.relationship}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Medical Information</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {selectedStudent.medicalInfo ? (
                      <p className="text-sm text-gray-700">{selectedStudent.medicalInfo}</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No medical information provided</p>
                    )}
                  </div>
                </div>

                {selectedStudent.createdAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Enrollment Details</h4>
                    <div>
                      <strong>Enrollment Date:</strong> {formatDate(selectedStudent.enrollmentDate || selectedStudent.createdAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewModalOpen(false)
                  handleEdit(selectedStudent)
                }}
              >
                Edit Student
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Students