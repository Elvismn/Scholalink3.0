import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, Calendar, CheckCircle, Edit, Trash2, RefreshCw, FileText } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { GRADE_LEVELS } from '@shared'
import { adminApi } from '../services/adminApi'

const Curriculum = () => {
  const [curriculums, setCurriculums] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState(null)
  const [courses, setCourses] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    academicYear: new Date().getFullYear().toString(),
    gradeLevel: '',
    description: '',
    status: 'Draft'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [curriculumRes, coursesRes] = await Promise.all([
        adminApi.getCurriculums(),
        adminApi.getCourses()
      ])
      setCurriculums(curriculumRes.data || curriculumRes || [])
      setCourses(coursesRes.data || coursesRes || [])
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
      const curriculumData = {
        title: formData.title.trim(),
        academicYear: formData.academicYear,
        gradeLevel: formData.gradeLevel,
        description: formData.description.trim(),
        status: formData.status
      }

      if (editingCurriculum) {
        await adminApi.updateCurriculum(editingCurriculum._id, curriculumData)
        showToast.success('Curriculum updated successfully')
      } else {
        await adminApi.createCurriculum(curriculumData)
        showToast.success('Curriculum created successfully')
      }
      
      setIsModalOpen(false)
      setEditingCurriculum(null)
      setFormData({
        title: '',
        academicYear: new Date().getFullYear().toString(),
        gradeLevel: '',
        description: '',
        status: 'Draft'
      })
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (curriculumId) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      try {
        await adminApi.deleteCurriculum(curriculumId)
        showToast.success('Curriculum deleted successfully')
        fetchData()
      } catch (error) {
        showToast.error('Failed to delete curriculum', error.data?.message || error.message)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Draft': return 'bg-yellow-100 text-yellow-800'
      case 'Archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns = [
    {
      key: 'title',
      title: 'Curriculum',
      render: (title, curriculum) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{title}</div>
            <div className="text-sm text-gray-500">
              {curriculum.gradeLevel} • {curriculum.academicYear}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'gradeLevel',
      title: 'Grade Level',
      render: (grade) => (
        <div className="text-gray-900">{grade}</div>
      )
    },
    {
      key: 'academicYear',
      title: 'Academic Year',
      render: (year) => (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
          <span>{year}</span>
        </div>
      )
    },
    {
      key: 'subjects',
      title: 'Subjects',
      render: (subjects) => (
        <div className="text-gray-900">{subjects?.length || 0}</div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
          {status}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, curriculum) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingCurriculum(curriculum)
              setFormData({
                title: curriculum.title || '',
                academicYear: curriculum.academicYear || new Date().getFullYear().toString(),
                gradeLevel: curriculum.gradeLevel || '',
                description: curriculum.description || '',
                status: curriculum.status || 'Draft'
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(curriculum._id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Management</h1>
          <p className="text-gray-600">Design and manage academic curriculum</p>
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
              setEditingCurriculum(null)
              setFormData({
                title: '',
                academicYear: new Date().getFullYear().toString(),
                gradeLevel: '',
                description: '',
                status: 'Draft'
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Curriculum
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
              <p className="text-sm text-gray-600">Total Curriculums</p>
              <p className="text-2xl font-bold">{curriculums.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">
                {curriculums.filter(c => c.status === 'Active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-2xl font-bold">
                {curriculums.filter(c => c.status === 'Draft').length}
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
              <p className="text-sm text-gray-600">Grade Levels</p>
              <p className="text-2xl font-bold">
                {[...new Set(curriculums.map(c => c.gradeLevel).filter(Boolean))].length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search curriculum by title or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Archived', label: 'Archived' }
            ]}
          />
        </div>
      </Card>

      {/* Curriculum Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading curriculum...</p>
          </div>
        ) : curriculums.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No curriculum found</p>
            <Button
              onClick={() => {
                setFormData({
                  title: '',
                  academicYear: new Date().getFullYear().toString(),
                  gradeLevel: '',
                  description: '',
                  status: 'Draft'
                })
                setIsModalOpen(true)
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Curriculum
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={curriculums.filter(curriculum => {
              if (!searchTerm && statusFilter === 'all') return true
              
              const searchLower = searchTerm.toLowerCase()
              const matchesSearch = searchTerm ? (
                curriculum.title?.toLowerCase().includes(searchLower) ||
                curriculum.description?.toLowerCase().includes(searchLower) ||
                curriculum.gradeLevel?.toLowerCase().includes(searchLower)
              ) : true
              
              const matchesStatus = statusFilter === 'all' || curriculum.status === statusFilter
              
              return matchesSearch && matchesStatus
            })}
            keyField="_id"
            emptyMessage="No curriculum match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCurriculum(null)
        }}
        title={editingCurriculum ? 'Edit Curriculum' : 'Add New Curriculum'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Curriculum Title"
            required
            placeholder="e.g., Mathematics Curriculum 2024"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Academic Year"
              required
              placeholder="e.g., 2024"
              value={formData.academicYear}
              onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
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
            label="Status"
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Active', label: 'Active' },
              { value: 'Archived', label: 'Archived' }
            ]}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Curriculum overview and objectives..."
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
                setEditingCurriculum(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingCurriculum ? 'Update Curriculum' : 'Add Curriculum'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Curriculum