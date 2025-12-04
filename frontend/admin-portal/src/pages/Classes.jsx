import { useState, useEffect } from 'react'
import { Search, Plus, Filter, Users, GraduationCap, Edit, Trash2, Eye } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast } from '@shared'
import { adminApi } from '../services/adminApi'

const Classes = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState({
    className: '',
    gradeLevel: '',
    teacherId: '',
    roomNumber: '',
    capacity: '',
    schedule: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getClassrooms()
      setClasses(response.data || response)
    } catch (error) {
      showToast.error('Failed to load classes', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClass) {
        await adminApi.updateClassroom(editingClass.id, formData)
      } else {
        await adminApi.createClassroom(formData)
      }
      setIsModalOpen(false)
      setEditingClass(null)
      setFormData({
        className: '',
        gradeLevel: '',
        teacherId: '',
        roomNumber: '',
        capacity: '',
        schedule: '',
        status: 'Active'
      })
      fetchClasses()
    } catch (error) {
      showToast.error('Operation failed', error.message)
    }
  }

  const handleEdit = (classItem) => {
    setEditingClass(classItem)
    setFormData({
      className: classItem.className || '',
      gradeLevel: classItem.gradeLevel || '',
      teacherId: classItem.teacherId || '',
      roomNumber: classItem.roomNumber || '',
      capacity: classItem.capacity || '',
      schedule: classItem.schedule || '',
      status: classItem.status || 'Active'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await adminApi.deleteClassroom(classId)
        fetchClasses()
      } catch (error) {
        showToast.error('Failed to delete class', error.message)
      }
    }
  }

  const filteredClasses = classes.filter(classItem => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      (classItem.className?.toLowerCase().includes(searchLower)) ||
      (classItem.gradeLevel?.toLowerCase().includes(searchLower)) ||
      (classItem.roomNumber?.toLowerCase().includes(searchLower)) ||
      (classItem.teacherName?.toLowerCase().includes(searchLower))
    )
  })

  const columns = [
    {
      key: 'class',
      title: 'Class Information',
      render: (_, classItem) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{classItem.className}</div>
            <div className="text-sm text-gray-500">
              Grade {classItem.gradeLevel} • Room {classItem.roomNumber}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'teacher',
      title: 'Teacher',
      render: (_, classItem) => (
        <div className="text-gray-900">{classItem.teacherName || 'Not assigned'}</div>
      )
    },
    {
      key: 'students',
      title: 'Students',
      render: (_, classItem) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{classItem.studentCount || 0} / {classItem.capacity || 30}</span>
        </div>
      )
    },
    {
      key: 'schedule',
      title: 'Schedule',
      render: (schedule) => <div className="text-gray-900">{schedule || 'Not set'}</div>
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          status === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, classItem) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(classItem)}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(classItem.id)}
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">Manage classrooms and class schedules</p>
        </div>
        <Button
          onClick={() => {
            setEditingClass(null)
            setFormData({
              className: '',
              gradeLevel: '',
              teacherId: '',
              roomNumber: '',
              capacity: '',
              schedule: '',
              status: 'Active'
            })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search classes by name, grade, or teacher..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select
            placeholder="Filter by grade"
            options={[
              { value: 'all', label: 'All Grades' },
              { value: '1', label: 'Grade 1' },
              { value: '2', label: 'Grade 2' },
              { value: '3', label: 'Grade 3' },
              { value: '4', label: 'Grade 4' },
              { value: '5', label: 'Grade 5' },
              { value: '6', label: 'Grade 6' },
              { value: '7', label: 'Grade 7' },
              { value: '8', label: 'Grade 8' }
            ]}
            className="w-full md:w-48"
          />
          <Button variant="secondary" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Classes Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredClasses}
          keyField="id"
          loading={loading}
          emptyMessage="No classes found"
        />
      </Card>

      {/* Add/Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingClass(null)
        }}
        title={editingClass ? 'Edit Class' : 'Add New Class'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Class Name"
              required
              placeholder="e.g., Mathematics, Science"
              value={formData.className}
              onChange={(e) => setFormData({...formData, className: e.target.value})}
            />
            <Select
              label="Grade Level"
              required
              options={[
                { value: '1', label: 'Grade 1' },
                { value: '2', label: 'Grade 2' },
                { value: '3', label: 'Grade 3' },
                { value: '4', label: 'Grade 4' },
                { value: '5', label: 'Grade 5' },
                { value: '6', label: 'Grade 6' },
                { value: '7', label: 'Grade 7' },
                { value: '8', label: 'Grade 8' }
              ]}
              value={formData.gradeLevel}
              onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Room Number"
              required
              value={formData.roomNumber}
              onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
            />
            <Input
              label="Capacity"
              type="number"
              required
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            />
          </div>

          <Input
            label="Teacher ID"
            value={formData.teacherId}
            onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
            placeholder="Teacher's employee ID"
          />

          <Input
            label="Schedule"
            value={formData.schedule}
            onChange={(e) => setFormData({...formData, schedule: e.target.value})}
            placeholder="e.g., Mon-Wed-Fri 8:00-10:00"
          />

          <Select
            label="Status"
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Full', label: 'Full' }
            ]}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setEditingClass(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingClass ? 'Update Class' : 'Add Class'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Classes
