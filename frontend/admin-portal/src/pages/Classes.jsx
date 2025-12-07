import { useState, useEffect } from 'react'
import { Search, Plus, Users, GraduationCap, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { GRADE_LEVELS } from '@shared'
import { adminApi } from '../services/adminApi'

const Classes = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: '',
    classTeacher: '',
    capacity: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [classesRes, teachersRes] = await Promise.all([
        adminApi.getClassrooms(),
        adminApi.getStaff()
      ])
      setClasses(classesRes.data || classesRes || [])
      setTeachers(teachersRes.data || teachersRes || [])
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
      const classData = {
        name: formData.name.trim(),
        gradeLevel: formData.gradeLevel,
        classTeacher: formData.classTeacher,
        capacity: parseInt(formData.capacity) || 30
      }

      if (editingClass) {
        await adminApi.updateClassroom(editingClass._id, classData)
        showToast.success('Class updated successfully')
      } else {
        await adminApi.createClassroom(classData)
        showToast.success('Class created successfully')
      }
      
      setIsModalOpen(false)
      setEditingClass(null)
      setFormData({ name: '', gradeLevel: '', classTeacher: '', capacity: '' })
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await adminApi.deleteClassroom(classId)
        showToast.success('Class deleted successfully')
        fetchData()
      } catch (error) {
        showToast.error('Failed to delete class', error.data?.message || error.message)
      }
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Class Name',
      render: (name, cls) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">Grade: {cls.gradeLevel}</div>
          </div>
        </div>
      )
    },
    {
      key: 'classTeacher',
      title: 'Class Teacher',
      render: (teacher, cls) => (
        <div>
          <div className="font-medium text-gray-900">
            {teacher?.firstName} {teacher?.lastName}
          </div>
          <div className="text-sm text-gray-500">{teacher?.position}</div>
        </div>
      )
    },
    {
      key: 'students',
      title: 'Students',
      render: (students) => (
        <div className="flex items-center">
          <Users className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium">{students?.length || 0}</span>
          <span className="text-sm text-gray-500 ml-1">students</span>
        </div>
      )
    },
    {
      key: 'capacity',
      title: 'Capacity',
      render: (capacity) => (
        <div className="text-gray-900">{capacity}</div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, cls) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingClass(cls)
              setFormData({
                name: cls.name || '',
                gradeLevel: cls.gradeLevel || '',
                classTeacher: cls.classTeacher?._id || '',
                capacity: cls.capacity?.toString() || ''
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(cls._id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Manage classrooms and class assignments</p>
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
              setEditingClass(null)
              setFormData({ name: '', gradeLevel: '', classTeacher: '', capacity: '' })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold">{classes.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold">
                {classes.reduce((total, cls) => total + (cls.students?.length || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Class Teachers</p>
              <p className="text-2xl font-bold">
                {[...new Set(classes.map(c => c.classTeacher?._id).filter(Boolean))].length}
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
            placeholder="Search classes by name, grade, or teacher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Classes Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-12 text-center">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No classes found</p>
            <Button
              onClick={() => {
                setFormData({ name: '', gradeLevel: '', classTeacher: '', capacity: '' })
                setIsModalOpen(true)
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Class
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={classes.filter(cls => 
              !searchTerm || 
              cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              cls.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              `${cls.classTeacher?.firstName} ${cls.classTeacher?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            keyField="_id"
            emptyMessage="No classes match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
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
              placeholder="e.g., Form 1A"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Select
              label="Grade Level"
              required
              options={GRADE_LEVELS.map(grade => ({ value: grade, label: grade }))}
              value={formData.gradeLevel}
              onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
            />
          </div>

          <Select
            label="Class Teacher"
            options={[
              { value: '', label: 'Select a teacher' },
              ...teachers.map(teacher => ({
                value: teacher._id,
                label: `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''} - ${teacher.position || ''}`
              }))
            ]}
            value={formData.classTeacher}
            onChange={(e) => setFormData({...formData, classTeacher: e.target.value})}
          />

          <Input
            label="Capacity"
            type="number"
            required
            min="1"
            max="60"
            placeholder="Maximum number of students"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingClass(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingClass ? 'Update Class' : 'Add Class'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Classes