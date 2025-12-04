import { useState, useEffect } from 'react'
import { Search, Plus, Filter, Edit, Trash2, Eye } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast } from '@shared'
import { STUDENT_STATUS, GRADE_LEVELS } from '@shared'
import { adminApi } from '../services/adminApi'

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    grade: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getStudents()
      setStudents(response.data || response)
    } catch (error) {
      showToast.error('Failed to load students', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingStudent) {
        // Update student
        await adminApi.updateStudent(editingStudent.id, formData)
      } else {
        // Create student
        await adminApi.createStudent(formData)
      }
      setIsModalOpen(false)
      setEditingStudent(null)
      setFormData({
        firstName: '',
        lastName: '',
        grade: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        address: '',
        status: 'Active'
      })
      fetchStudents()
    } catch (error) {
      showToast.error('Operation failed', error.message)
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      grade: student.grade || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      address: student.address || '',
      status: student.status || 'Active'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await adminApi.deleteStudent(studentId)
        fetchStudents()
      } catch (error) {
        showToast.error('Failed to delete student', error.message)
      }
    }
  }

  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      (student.firstName?.toLowerCase().includes(searchLower)) ||
      (student.lastName?.toLowerCase().includes(searchLower)) ||
      (student.grade?.toLowerCase().includes(searchLower)) ||
      (student.parentName?.toLowerCase().includes(searchLower))
    )
  })

  const columns = [
    {
      key: 'name',
      title: 'Student Name',
      render: (_, student) => (
        <div>
          <div className="font-medium text-gray-900">{student.firstName} {student.lastName}</div>
          <div className="text-sm text-gray-500">ID: {student.studentId || `STU${student.id?.toString().padStart(4, '0')}`}</div>
        </div>
      )
    },
    {
      key: 'grade',
      title: 'Grade',
      render: (grade) => <div className="text-gray-900">{grade}</div>
    },
    {
      key: 'parentName',
      title: 'Parent/Guardian',
      render: (parentName, student) => (
        <div>
          <div className="text-gray-900">{parentName}</div>
          <div className="text-sm text-gray-500">{student.parentPhone}</div>
        </div>
      )
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
      render: (_, student) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(student)}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(student.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage student records and information</p>
        </div>
        <Button
          onClick={() => {
            setEditingStudent(null)
            setFormData({
              firstName: '',
              lastName: '',
              grade: '',
              parentName: '',
              parentPhone: '',
              parentEmail: '',
              address: '',
              status: 'Active'
            })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Student
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
                placeholder="Search students by name, grade, or parent..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select
            placeholder="Filter by status"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            className="w-full md:w-48"
            onChange={(e) => {
              // Implement status filtering
              console.log('Filter by:', e.target.value)
            }}
          />
          <Button variant="secondary" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Students Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredStudents}
          keyField="id"
          loading={loading}
          emptyMessage="No students found"
        />
      </Card>

      {/* Add/Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingStudent(null)
        }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
            <Input
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>

          <Select
            label="Grade"
            required
            options={GRADE_LEVELS.map(grade => ({ value: grade, label: grade }))}
            value={formData.grade}
            onChange={(e) => setFormData({...formData, grade: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Parent Name"
              required
              value={formData.parentName}
              onChange={(e) => setFormData({...formData, parentName: e.target.value})}
            />
            <Input
              label="Parent Phone"
              required
              value={formData.parentPhone}
              onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
            />
          </div>

          <Input
            label="Parent Email"
            type="email"
            value={formData.parentEmail}
            onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
          />

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />

          <Select
            label="Status"
            options={Object.entries(STUDENT_STATUS).map(([key, value]) => ({
              value: key,
              label: value
            }))}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setEditingStudent(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Students
