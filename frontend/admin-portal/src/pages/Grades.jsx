import { useState, useEffect } from 'react'
import { Search, Plus, BarChart, BookOpen, User, Edit, Trash2, RefreshCw, Download } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

const Grades = () => {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState(null)
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString())
  const [term, setTerm] = useState('Term 1')
  const [formData, setFormData] = useState({
    student: '',
    course: '',
    academicYear: new Date().getFullYear().toString(),
    term: 'Term 1',
    scores: {
      assignments: '',
      midterm: '',
      final: '',
      practical: ''
    }
  })

  useEffect(() => {
    fetchData()
  }, [academicYear, term])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [gradesRes, studentsRes, coursesRes] = await Promise.all([
        adminApi.getGrades({ academicYear, term }),
        adminApi.getStudents(),
        adminApi.getCourses()
      ])
      setGrades(gradesRes.data || gradesRes || [])
      setStudents(studentsRes.data || studentsRes || [])
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
      const gradeData = {
        student: formData.student,
        course: formData.course,
        academicYear: formData.academicYear,
        term: formData.term,
        scores: {
          assignments: parseFloat(formData.scores.assignments) || 0,
          midterm: parseFloat(formData.scores.midterm) || 0,
          final: parseFloat(formData.scores.final) || 0,
          practical: parseFloat(formData.scores.practical) || 0
        }
      }

      if (editingGrade) {
        await adminApi.updateGrade(editingGrade._id, gradeData)
        showToast.success('Grade updated successfully')
      } else {
        await adminApi.createGrade(gradeData)
        showToast.success('Grade created successfully')
      }
      
      setIsModalOpen(false)
      setEditingGrade(null)
      setFormData({
        student: '',
        course: '',
        academicYear: new Date().getFullYear().toString(),
        term: 'Term 1',
        scores: {
          assignments: '',
          midterm: '',
          final: '',
          practical: ''
        }
      })
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (gradeId) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        await adminApi.deleteGrade(gradeId)
        showToast.success('Grade deleted successfully')
        fetchData()
      } catch (error) {
        showToast.error('Failed to delete grade', error.data?.message || error.message)
      }
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800'
      case 'B': return 'bg-blue-100 text-blue-800'
      case 'C': return 'bg-yellow-100 text-yellow-800'
      case 'D': return 'bg-orange-100 text-orange-800'
      case 'F': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns = [
    {
      key: 'student',
      title: 'Student',
      render: (student) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {student?.firstName} {student?.lastName}
            </div>
            <div className="text-sm text-gray-500">{student?.grade}</div>
          </div>
        </div>
      )
    },
    {
      key: 'course',
      title: 'Course',
      render: (course) => (
        <div className="flex items-center">
          <div className="bg-purple-100 rounded p-1.5 mr-2">
            <BookOpen className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{course?.name}</div>
            <div className="text-xs text-gray-500">{course?.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'totalScore',
      title: 'Score',
      render: (score) => (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{score?.toFixed(1) || '0.0'}</div>
          <div className="text-xs text-gray-500">/ 100</div>
        </div>
      )
    },
    {
      key: 'grade',
      title: 'Grade',
      render: (grade) => (
        <div className="text-center">
          <span className={`px-3 py-1 text-sm font-bold rounded-full ${getGradeColor(grade)}`}>
            {grade}
          </span>
        </div>
      )
    },
    {
      key: 'term',
      title: 'Term',
      render: (term) => (
        <div className="text-gray-900">{term}</div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, grade) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingGrade(grade)
              setFormData({
                student: grade.student?._id || '',
                course: grade.course?._id || '',
                academicYear: grade.academicYear || new Date().getFullYear().toString(),
                term: grade.term || 'Term 1',
                scores: {
                  assignments: grade.scores?.assignments?.toString() || '',
                  midterm: grade.scores?.midterm?.toString() || '',
                  final: grade.scores?.final?.toString() || '',
                  practical: grade.scores?.practical?.toString() || ''
                }
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(grade._id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
          <p className="text-gray-600">Record and manage student grades</p>
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
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => showToast.info('Export feature coming soon')}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={() => {
              setEditingGrade(null)
              setFormData({
                student: '',
                course: '',
                academicYear: new Date().getFullYear().toString(),
                term: 'Term 1',
                scores: {
                  assignments: '',
                  midterm: '',
                  final: '',
                  practical: ''
                }
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Grade
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <Select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              options={[
                { value: '2023', label: '2023' },
                { value: '2024', label: '2024' },
                { value: '2025', label: '2025' }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term
            </label>
            <Select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              options={[
                { value: 'Term 1', label: 'Term 1' },
                { value: 'Term 2', label: 'Term 2' },
                { value: 'Term 3', label: 'Term 3' }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student or course..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Grades</p>
              <p className="text-2xl font-bold">{grades.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold">
                {grades.length > 0 
                  ? (grades.reduce((sum, grade) => sum + (grade.totalScore || 0), 0) / grades.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold">
                {grades.length > 0 
                  ? ((grades.filter(g => g.grade !== 'F').length / grades.length) * 100).toFixed(0) + '%'
                  : '0%'
                }
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
              <p className="text-sm text-gray-600">Courses</p>
              <p className="text-2xl font-bold">
                {[...new Set(grades.map(g => g.course?._id).filter(Boolean))].length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading grades...</p>
          </div>
        ) : grades.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No grades found for {academicYear} - {term}</p>
            <Button
              onClick={() => {
                setFormData({
                  student: '',
                  course: '',
                  academicYear,
                  term,
                  scores: {
                    assignments: '',
                    midterm: '',
                    final: '',
                    practical: ''
                  }
                })
                setIsModalOpen(true)
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Grade
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={grades.filter(grade => {
              if (!searchTerm) return true
              const searchLower = searchTerm.toLowerCase()
              const studentName = `${grade.student?.firstName || ''} ${grade.student?.lastName || ''}`.toLowerCase()
              const courseName = grade.course?.name?.toLowerCase() || ''
              const courseCode = grade.course?.code?.toLowerCase() || ''
              
              return (
                studentName.includes(searchLower) ||
                courseName.includes(searchLower) ||
                courseCode.includes(searchLower)
              )
            })}
            keyField="_id"
            emptyMessage="No grades match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingGrade(null)
        }}
        title={editingGrade ? 'Edit Grade' : 'Add New Grade'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Student"
              required
              options={[
                { value: '', label: 'Select student' },
                ...students.map(student => ({
                  value: student._id,
                  label: `${student.firstName} ${student.lastName} - ${student.grade}`
                }))
              ]}
              value={formData.student}
              onChange={(e) => setFormData({...formData, student: e.target.value})}
            />
            <Select
              label="Course"
              required
              options={[
                { value: '', label: 'Select course' },
                ...courses.map(course => ({
                  value: course._id,
                  label: `${course.name} (${course.code})`
                }))
              ]}
              value={formData.course}
              onChange={(e) => setFormData({...formData, course: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Academic Year"
              required
              options={[
                { value: '2023', label: '2023' },
                { value: '2024', label: '2024' },
                { value: '2025', label: '2025' }
              ]}
              value={formData.academicYear}
              onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
            />
            <Select
              label="Term"
              required
              options={[
                { value: 'Term 1', label: 'Term 1' },
                { value: 'Term 2', label: 'Term 2' },
                { value: 'Term 3', label: 'Term 3' }
              ]}
              value={formData.term}
              onChange={(e) => setFormData({...formData, term: e.target.value})}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Assignments (20%)"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={formData.scores.assignments}
                onChange={(e) => setFormData({
                  ...formData,
                  scores: { ...formData.scores, assignments: e.target.value }
                })}
              />
              <Input
                label="Midterm (30%)"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={formData.scores.midterm}
                onChange={(e) => setFormData({
                  ...formData,
                  scores: { ...formData.scores, midterm: e.target.value }
                })}
              />
              <Input
                label="Final Exam (40%)"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={formData.scores.final}
                onChange={(e) => setFormData({
                  ...formData,
                  scores: { ...formData.scores, final: e.target.value }
                })}
              />
              <Input
                label="Practical (10%)"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={formData.scores.practical}
                onChange={(e) => setFormData({
                  ...formData,
                  scores: { ...formData.scores, practical: e.target.value }
                })}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <strong>Note:</strong> Total score will be calculated automatically based on weights.
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingGrade(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingGrade ? 'Update Grade' : 'Add Grade'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Grades