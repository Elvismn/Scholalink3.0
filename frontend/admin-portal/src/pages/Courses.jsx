import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, BookOpen, User, Hash, Edit, Trash2, RefreshCw } from 'lucide-react'
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

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [instructors, setInstructors] = useState([])
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    instructor: '',
    department: '',
    credits: '1',
    description: '',
    syllabus: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Courses - Fetching data...')
      const [coursesRes, staffRes, deptRes] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getStaff(),
        adminApi.getDepartments()
      ])
      
      console.log('✅ Courses - Data received:', coursesRes)
      
      // Handle courses response - FIXED: Backend returns data.courses
      let coursesData = []
      if (coursesRes && coursesRes.data) {
        if (Array.isArray(coursesRes.data.courses)) {
          coursesData = coursesRes.data.courses
        } else if (Array.isArray(coursesRes.data)) {
          coursesData = coursesRes.data
        }
      }
      setCourses(coursesData || [])
      
      // Handle staff response
      let staffData = []
      if (staffRes) {
        if (Array.isArray(staffRes.data)) {
          staffData = staffRes.data
        } else if (Array.isArray(staffRes)) {
          staffData = staffRes
        }
      }
      
      // Filter to get only teachers/instructors
      const teachers = staffData.filter(
        staff => staff.position?.toLowerCase().includes('teacher') || 
                staff.position?.toLowerCase().includes('instructor') ||
                staff.position?.toLowerCase().includes('lecturer')
      )
      setInstructors(teachers)
      
      // Handle departments response
      let departmentsData = []
      if (deptRes) {
        if (Array.isArray(deptRes.data)) {
          departmentsData = deptRes.data
        } else if (Array.isArray(deptRes)) {
          departmentsData = deptRes
        }
      }
      setDepartments(departmentsData || [])
      
      setError('')
    } catch (error) {
      console.error('❌ Courses - Error fetching data:', error)
      setError('Failed to load data. Please check your connection and try again.')
      showToast.error('Failed to load data', error.data?.message || error.message)
      setCourses([])
      setInstructors([])
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!Array.isArray(courses)) return []
    if (!searchTerm) return courses
    
    const searchLower = searchTerm.toLowerCase()
    
    return courses.filter(course => {
      if (!course) return false
      
      const courseName = course.name?.toLowerCase() || ''
      const courseCode = course.code?.toLowerCase() || ''
      const instructorName = `${course.instructor?.firstName || ''} ${course.instructor?.lastName || ''}`.toLowerCase()
      const departmentName = course.department?.name?.toLowerCase() || ''
      const description = course.description?.toLowerCase() || ''
      
      return (
        courseName.includes(searchLower) ||
        courseCode.includes(searchLower) ||
        instructorName.includes(searchLower) ||
        departmentName.includes(searchLower) ||
        description.includes(searchLower)
      )
    })
  }, [courses, searchTerm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const courseData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        instructor: formData.instructor,
        department: formData.department,
        credits: parseInt(formData.credits) || 1,
        description: formData.description.trim(),
        syllabus: formData.syllabus
      }

      console.log('💾 Courses - Saving course:', editingCourse ? 'update' : 'create')

      if (editingCourse) {
        await adminApi.updateCourse(editingCourse._id, courseData)
        showToast.success('Course updated successfully')
      } else {
        await adminApi.createCourse(courseData)
        showToast.success('Course created successfully')
      }
      
      await fetchData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Courses - Error saving course:', error)
      setError('Failed to save course. Please try again.')
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        console.log('🗑️ Courses - Deleting course:', courseId)
        await adminApi.deleteCourse(courseId)
        showToast.success('Course deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Courses - Error deleting course:', error)
        setError('Failed to delete course. Please try again.')
        showToast.error('Failed to delete course', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      instructor: '',
      department: '',
      credits: '1',
      description: '',
      syllabus: []
    })
    setEditingCourse(null)
  }

  const openCreateModal = () => {
    console.log('➕ Courses - Opening create modal')
    resetForm()
    setIsModalOpen(true)
  }

  // Add syllabus item
  const addSyllabusItem = () => {
    setFormData({
      ...formData,
      syllabus: [...formData.syllabus, { duration: '' }]
    })
  }

  // Remove syllabus item
  const removeSyllabusItem = (index) => {
    const updatedSyllabus = formData.syllabus.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      syllabus: updatedSyllabus
    })
  }

  // Update syllabus item
  const updateSyllabusItem = (index, value) => {
    const updatedSyllabus = formData.syllabus.map((item, i) => 
      i === index ? { ...item, duration: value } : item
    )
    setFormData({
      ...formData,
      syllabus: updatedSyllabus
    })
  }

  // Calculate stats safely
  const totalCourses = courses.length || 0
  const instructorsCount = Array.isArray(courses)
    ? [...new Set(courses.map(c => c.instructor?._id).filter(Boolean))].length
    : 0
  const totalCredits = Array.isArray(courses)
    ? courses.reduce((total, course) => total + (course.credits || 1), 0)
    : 0
  const departmentsCount = Array.isArray(courses)
    ? [...new Set(courses.map(c => c.department?._id).filter(Boolean))].length
    : 0

  // Display courses - filtered if search is active
  const displayCourses = filteredCourses

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Courses Management</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredCourses.length} of {courses.length} courses
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              'Manage academic courses and assignments'
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
            Add Course
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
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredCourses.length} results
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
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold">{totalCourses}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Instructors</p>
              <p className="text-2xl font-bold">{instructorsCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Hash className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold">{totalCredits}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Departments</p>
              <p className="text-2xl font-bold">{departmentsCount}</p>
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
            placeholder="Search courses by name, code, instructor, department, or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Courses Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        ) : !Array.isArray(displayCourses) || displayCourses.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No courses found' : 'No courses yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No courses found for "${searchTerm}". Try a different search term.`
                : 'Get started by creating your first course'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create First Course
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
            {displayCourses.map((course) => {
              const instructorName = course.instructor 
                ? `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}`.trim()
                : 'No instructor assigned'
              const departmentName = course.department?.name || 'No department assigned'
              
              return (
                <div key={course._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{course.name}</h3>
                          <p className="text-sm text-gray-600 truncate">Code: {course.code || 'No code'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => {
                          setEditingCourse(course)
                          setFormData({
                            name: course.name || '',
                            code: course.code || '',
                            instructor: course.instructor?._id || '',
                            department: course.department?._id || '',
                            credits: course.credits?.toString() || '1',
                            description: course.description || '',
                            syllabus: course.syllabus || []
                          })
                          setIsModalOpen(true)
                        }} 
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id)} 
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span><strong>Instructor:</strong> {instructorName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Department:</span>
                      <Badge variant="info">
                        {departmentName}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span><strong>Credits:</strong> {course.credits || 1}</span>
                    </div>
                    
                    {course.description && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-gray-700">Description:</span>
                        <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                          {course.description}
                        </div>
                      </div>
                    )}
                    
                    {course.syllabus && course.syllabus.length > 0 && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-gray-700">Syllabus:</span>
                        <div className="mt-1 text-xs text-gray-500">
                          <ul className="list-disc pl-4">
                            {course.syllabus.map((item, index) => (
                              <li key={index}>{item.duration}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {course.createdAt && (
                    <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                      Created: {new Date(course.createdAt).toLocaleDateString('en-US', {
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
          setEditingCourse(null)
          resetForm()
        }}
        closeOnBackdropClick={false}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Course Name *"
              required
              placeholder="e.g., Introduction to Mathematics"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Input
              label="Course Code *"
              required
              placeholder="e.g., MATH101"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor *
              </label>
              <select
                required
                value={formData.instructor}
                onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select instructor</option>
                {instructors.map(instructor => (
                  <option key={instructor._id} value={instructor._id}>
                    {instructor.firstName || 'Unknown'} {instructor.lastName || ''} - {instructor.position || 'Staff'}
                  </option>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Credits"
              type="number"
              min="1"
              max="10"
              value={formData.credits}
              onChange={(e) => setFormData({...formData, credits: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Course description and objectives..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Syllabus Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900">Syllabus (Optional)</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addSyllabusItem}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Duration
              </Button>
            </div>
            
            {formData.syllabus.length > 0 ? (
              <div className="space-y-2">
                {formData.syllabus.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="e.g., Week 1-4: Introduction"
                      value={item.duration}
                      onChange={(e) => updateSyllabusItem(index, e.target.value)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeSyllabusItem(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                No syllabus items added. Click "Add Duration" to add one.
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingCourse(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingCourse ? 'Update Course' : 'Add Course'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Courses