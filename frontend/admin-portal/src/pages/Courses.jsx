import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, User, Hash, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [instructors, setInstructors] = useState([])
  const [departments, setDepartments] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    instructor: '',
    department: '',
    credits: '1',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [coursesRes, staffRes, deptRes] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getStaff(),
        adminApi.getDepartments()
      ])
      setCourses(coursesRes.data || coursesRes || [])
      // Filter to get only teachers/instructors
      const teachers = (staffRes.data || staffRes || []).filter(
        staff => staff.position?.toLowerCase().includes('teacher') || 
                staff.position?.toLowerCase().includes('instructor')
      )
      setInstructors(teachers)
      setDepartments(deptRes.data || deptRes || [])
    } catch (error) {
      showToast.error('Failed to load data', error.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

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
        description: formData.description.trim()
      }

      if (editingCourse) {
        await adminApi.updateCourse(editingCourse._id, courseData)
        showToast.success('Course updated successfully')
      } else {
        await adminApi.createCourse(courseData)
        showToast.success('Course created successfully')
      }
      
      setIsModalOpen(false)
      setEditingCourse(null)
      setFormData({
        name: '',
        code: '',
        instructor: '',
        department: '',
        credits: '1',
        description: ''
      })
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await adminApi.deleteCourse(courseId)
        showToast.success('Course deleted successfully')
        fetchData()
      } catch (error) {
        showToast.error('Failed to delete course', error.data?.message || error.message)
      }
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Course',
      render: (name, course) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">Code: {course.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'instructor',
      title: 'Instructor',
      render: (instructor) => (
        <div className="flex items-center">
          <div className="bg-gray-100 rounded-full p-1 mr-2">
            <User className="h-3 w-3 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {instructor?.firstName} {instructor?.lastName}
            </div>
            <div className="text-xs text-gray-500">{instructor?.position}</div>
          </div>
        </div>
      )
    },
    {
      key: 'department',
      title: 'Department',
      render: (department) => (
        <div className="text-gray-900">{department?.name || 'N/A'}</div>
      )
    },
    {
      key: 'credits',
      title: 'Credits',
      render: (credits) => (
        <div className="flex items-center">
          <Hash className="w-4 h-4 text-gray-400 mr-1" />
          <span className="font-medium">{credits || 1}</span>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      render: (description) => (
        <div className="text-sm text-gray-600 truncate max-w-xs">
          {description || 'No description'}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, course) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingCourse(course)
              setFormData({
                name: course.name || '',
                code: course.code || '',
                instructor: course.instructor?._id || '',
                department: course.department?._id || '',
                credits: course.credits?.toString() || '1',
                description: course.description || ''
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(course._id)}
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">Manage academic courses and assignments</p>
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
            onClick={() => {
              setEditingCourse(null)
              setFormData({
                name: '',
                code: '',
                instructor: '',
                department: '',
                credits: '1',
                description: ''
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Instructors</p>
              <p className="text-2xl font-bold">
                {[...new Set(courses.map(c => c.instructor?._id).filter(Boolean))].length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Hash className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold">
                {courses.reduce((total, course) => total + (course.credits || 1), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Departments</p>
              <p className="text-2xl font-bold">
                {[...new Set(courses.map(c => c.department?._id).filter(Boolean))].length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses by name, code, or instructor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Courses Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No courses found</p>
            <Button
              onClick={() => {
                setFormData({
                  name: '',
                  code: '',
                  instructor: '',
                  department: '',
                  credits: '1',
                  description: ''
                })
                setIsModalOpen(true)
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Course
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={courses.filter(course => {
              if (!searchTerm) return true
              const searchLower = searchTerm.toLowerCase()
              const instructorName = `${course.instructor?.firstName || ''} ${course.instructor?.lastName || ''}`.toLowerCase()
              
              return (
                course.name?.toLowerCase().includes(searchLower) ||
                course.code?.toLowerCase().includes(searchLower) ||
                instructorName.includes(searchLower) ||
                course.department?.name?.toLowerCase().includes(searchLower)
              )
            })}
            keyField="_id"
            emptyMessage="No courses match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCourse(null)
        }}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Course Name"
              required
              placeholder="e.g., Introduction to Mathematics"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Input
              label="Course Code"
              required
              placeholder="e.g., MATH101"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Instructor"
              required
              options={[
                { value: '', label: 'Select instructor' },
                ...instructors.map(instructor => ({
                  value: instructor._id,
                  label: `${instructor.user?.firstName} ${instructor.user?.lastName} - ${instructor.position}`
                }))
              ]}
              value={formData.instructor}
              onChange={(e) => setFormData({...formData, instructor: e.target.value})}
            />
            <Select
              label="Department"
              options={[
                { value: '', label: 'Select department' },
                ...departments.map(dept => ({
                  value: dept._id,
                  label: dept.name
                }))
              ]}
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
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

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingCourse(null)
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