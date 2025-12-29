import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, Calendar, CheckCircle, Edit, Trash2, RefreshCw, FileText, X } from 'lucide-react'
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
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [subjectSearch, setSubjectSearch] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    academicYear: new Date().getFullYear().toString(),
    gradeLevels: '',
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
      
      // Handle curriculum response - FIXED: Backend returns data.curriculums
      let curriculumData = []
      if (curriculumRes && curriculumRes.data) {
        if (Array.isArray(curriculumRes.data.curriculums)) {
          curriculumData = curriculumRes.data.curriculums
        } else if (Array.isArray(curriculumRes.data)) {
          curriculumData = curriculumRes.data
        }
      }
      setCurriculums(curriculumData || [])
      
      // Handle courses response
      let coursesData = []
      if (coursesRes && coursesRes.data) {
        if (Array.isArray(coursesRes.data.courses)) {
          coursesData = coursesRes.data.courses
        } else if (Array.isArray(coursesRes.data)) {
          coursesData = coursesRes.data
        }
      }
      setCourses(coursesData || [])
    } catch (error) {
      console.error('❌ Curriculum - Error fetching data:', error)
      showToast.error('Failed to load data', error.data?.message || error.message)
      setCurriculums([])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  // Filter courses for subject selection
  const filteredCourses = courses.filter(course => {
    if (!subjectSearch) return true
    const searchLower = subjectSearch.toLowerCase()
    return (
      course.name?.toLowerCase().includes(searchLower) ||
      course.code?.toLowerCase().includes(searchLower) ||
      course.description?.toLowerCase().includes(searchLower)
    )
  })

  // Add subject to curriculum
  const addSubject = (course) => {
    if (!selectedSubjects.some(sub => sub.subject._id === course._id)) {
      const subjectObj = {
        subject: course,
        syllabus: []
      }
      setSelectedSubjects([...selectedSubjects, subjectObj])
      setSubjectSearch('')
    }
  }

  // Remove subject from curriculum
  const removeSubject = (courseId) => {
    setSelectedSubjects(selectedSubjects.filter(sub => sub.subject._id !== courseId))
  }

  // Add syllabus item to subject
  const addSyllabusItem = (courseId) => {
    const syllabusItem = prompt('Enter syllabus item:')
    if (syllabusItem) {
      const updatedSubjects = selectedSubjects.map(sub => {
        if (sub.subject._id === courseId) {
          return {
            ...sub,
            syllabus: [...sub.syllabus, syllabusItem]
          }
        }
        return sub
      })
      setSelectedSubjects(updatedSubjects)
    }
  }

  // Remove syllabus item from subject
  const removeSyllabusItem = (courseId, syllabusIndex) => {
    const updatedSubjects = selectedSubjects.map(sub => {
      if (sub.subject._id === courseId) {
        return {
          ...sub,
          syllabus: sub.syllabus.filter((_, index) => index !== syllabusIndex)
        }
      }
      return sub
    })
    setSelectedSubjects(updatedSubjects)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Prepare subjects data for backend
      const subjectsData = selectedSubjects.map(subject => ({
        subject: subject.subject._id,
        syllabus: subject.syllabus
      }))

      const curriculumData = {
        title: formData.title.trim(),
        academicYear: formData.academicYear,
        gradeLevels: formData.gradeLevels, // FIXED: Use gradeLevels (plural)
        description: formData.description.trim(),
        status: formData.status,
        subjects: subjectsData // FIXED: Include subjects array
      }

      console.log('💾 Curriculum - Saving curriculum:', editingCurriculum ? 'update' : 'create')
      console.log('📚 Subjects data:', subjectsData)

      if (editingCurriculum) {
        await adminApi.updateCurriculum(editingCurriculum._id, curriculumData)
        showToast.success('Curriculum updated successfully')
      } else {
        await adminApi.createCurriculum(curriculumData)
        showToast.success('Curriculum created successfully')
      }
      
      setIsModalOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('❌ Curriculum - Error saving curriculum:', error)
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (curriculumId) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      try {
        console.log('🗑️ Curriculum - Deleting curriculum:', curriculumId)
        await adminApi.deleteCurriculum(curriculumId)
        showToast.success('Curriculum deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Curriculum - Error deleting curriculum:', error)
        showToast.error('Failed to delete curriculum', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      academicYear: new Date().getFullYear().toString(),
      gradeLevels: '',
      description: '',
      status: 'Draft'
    })
    setSelectedSubjects([])
    setSubjectSearch('')
    setEditingCurriculum(null)
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
              {curriculum.gradeLevels} • {curriculum.academicYear}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'gradeLevels',
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
                gradeLevels: curriculum.gradeLevels || '', // FIXED: gradeLevels (plural)
                description: curriculum.description || '',
                status: curriculum.status || 'Draft'
              })
              
              // Set selected subjects from curriculum
              if (curriculum.subjects && Array.isArray(curriculum.subjects)) {
                const subjectsWithDetails = curriculum.subjects.map(sub => ({
                  subject: sub.subject || sub, // Handle both populated and non-populated
                  syllabus: sub.syllabus || []
                }))
                setSelectedSubjects(subjectsWithDetails)
              }
              
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
              resetForm()
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
                {[...new Set(curriculums.map(c => c.gradeLevels).filter(Boolean))].length}
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
                resetForm()
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
                curriculum.gradeLevels?.toLowerCase().includes(searchLower) // FIXED: gradeLevels
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
          resetForm()
        }}
        title={editingCurriculum ? 'Edit Curriculum' : 'Add New Curriculum'}
        size="lg"
        closeOnBackdropClick={false}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Curriculum Title *"
            required
            placeholder="e.g., Mathematics Curriculum 2024"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Academic Year *"
              required
              placeholder="e.g., 2024"
              value={formData.academicYear}
              onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
            />
            <Select
              label="Grade Level *"
              required
              options={GRADE_LEVELS.map(grade => ({ value: grade, label: grade }))}
              value={formData.gradeLevels}
              onChange={(e) => setFormData({...formData, gradeLevels: e.target.value})}
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

          {/* Subjects Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Subjects *</h3>
            
            {/* Subject Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses to add as subjects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
              />
            </div>

            {/* Available Courses */}
            {subjectSearch && filteredCourses.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredCourses.map(course => (
                  <div 
                    key={course._id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-sm">{course.name}</div>
                      <div className="text-xs text-gray-500">{course.code}</div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addSubject(course)}
                      disabled={selectedSubjects.some(sub => sub.subject._id === course._id)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Subjects */}
            {selectedSubjects.length > 0 ? (
              <div className="space-y-3">
                {selectedSubjects.map((subject, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-medium text-sm">{subject.subject.name}</div>
                        <div className="text-xs text-gray-500">{subject.subject.code}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubject(subject.subject._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Syllabus for this subject */}
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-700">Syllabus Items:</span>
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          onClick={() => addSyllabusItem(subject.subject._id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Item
                        </Button>
                      </div>
                      {subject.syllabus.length > 0 ? (
                        <ul className="space-y-1">
                          {subject.syllabus.map((item, syllabusIndex) => (
                            <li key={syllabusIndex} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => removeSyllabusItem(subject.subject._id, syllabusIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No syllabus items added</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No subjects added yet</p>
            )}

            <div className="mt-3 text-xs text-gray-500">
              <p>Selected subjects: {selectedSubjects.length}</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={submitting}
              disabled={selectedSubjects.length === 0}
            >
              {editingCurriculum ? 'Update Curriculum' : 'Add Curriculum'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Curriculum