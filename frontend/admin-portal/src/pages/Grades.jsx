import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, BarChart, BookOpen, User, Edit, Trash2, RefreshCw, Download } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    student: '',
    course: '',
    academicYear: new Date().getFullYear().toString(),
    term: 'Term 1',
    scores: {
      opener: '',
      midterm: '',
      final: ''
    },
    teacher: '',
    comments: ''
  })

  useEffect(() => {
    fetchData()
  }, [academicYear, term])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Grades - Fetching data...')
      const [gradesRes, studentsRes, coursesRes] = await Promise.all([
        adminApi.getGrades({ academicYear, term }),
        adminApi.getStudents(),
        adminApi.getCourses()
      ])
      
      console.log('✅ Grades - Data received:', gradesRes)
      
      // Handle grades response - FIXED: Backend returns data.grades
      let gradesData = []
      if (gradesRes && gradesRes.data) {
        if (Array.isArray(gradesRes.data.grades)) {
          gradesData = gradesRes.data.grades
        } else if (Array.isArray(gradesRes.data)) {
          gradesData = gradesRes.data
        }
      }
      setGrades(gradesData || [])
      
      // Handle students response
      let studentsData = []
      if (studentsRes) {
        if (Array.isArray(studentsRes.data)) {
          studentsData = studentsRes.data
        } else if (Array.isArray(studentsRes)) {
          studentsData = studentsRes
        }
      }
      setStudents(studentsData || [])
      
      // Handle courses response
      let coursesData = []
      if (coursesRes) {
        if (Array.isArray(coursesRes.data)) {
          coursesData = coursesRes.data
        } else if (Array.isArray(coursesRes)) {
          coursesData = coursesRes
        }
      }
      setCourses(coursesData || [])
      
      setError('')
    } catch (error) {
      console.error('❌ Grades - Error fetching data:', error)
      setError('Failed to load data. Please check your connection and try again.')
      showToast.error('Failed to load data', error.data?.message || error.message)
      setGrades([])
      setStudents([])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  // Filter grades based on search term
  const filteredGrades = useMemo(() => {
    if (!Array.isArray(grades)) return []
    if (!searchTerm) return grades
    
    const searchLower = searchTerm.toLowerCase()
    
    return grades.filter(grade => {
      if (!grade) return false
      
      const studentName = `${grade.student?.firstName || ''} ${grade.student?.lastName || ''}`.toLowerCase()
      const courseName = grade.course?.name?.toLowerCase() || ''
      const courseCode = grade.course?.code?.toLowerCase() || ''
      
      return (
        studentName.includes(searchLower) ||
        courseName.includes(searchLower) ||
        courseCode.includes(searchLower)
      )
    })
  }, [grades, searchTerm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // FIXED: Use correct score fields (opener, midterm, final) instead of (assignments, midterm, final, practical)
      const gradeData = {
        student: formData.student,
        course: formData.course,
        academicYear: formData.academicYear,
        term: formData.term,
        scores: {
          opener: parseFloat(formData.scores.opener) || 0,
          midterm: parseFloat(formData.scores.midterm) || 0,
          final: parseFloat(formData.scores.final) || 0
        },
        teacher: formData.teacher,
        comments: formData.comments
      }

      console.log('💾 Grades - Saving grade:', editingGrade ? 'update' : 'create')

      if (editingGrade) {
        await adminApi.updateGrade(editingGrade._id, gradeData)
        showToast.success('Grade updated successfully')
      } else {
        await adminApi.createGrade(gradeData)
        showToast.success('Grade created successfully')
      }
      
      await fetchData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Grades - Error saving grade:', error)
      setError('Failed to save grade. Please try again.')
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (gradeId) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        console.log('🗑️ Grades - Deleting grade:', gradeId)
        await adminApi.deleteGrade(gradeId)
        showToast.success('Grade deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Grades - Error deleting grade:', error)
        setError('Failed to delete grade. Please try again.')
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
      case 'Incomplete': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const resetForm = () => {
    setFormData({
      student: '',
      course: '',
      academicYear: new Date().getFullYear().toString(),
      term: 'Term 1',
      scores: {
        opener: '',
        midterm: '',
        final: ''
      },
      teacher: '',
      comments: ''
    })
    setEditingGrade(null)
  }

  const openCreateModal = () => {
    console.log('➕ Grades - Opening create modal')
    resetForm()
    setIsModalOpen(true)
  }

  // Calculate stats safely
  const totalGrades = grades.length || 0
  const averageScore = totalGrades > 0 
    ? (grades.reduce((sum, grade) => sum + (grade.totalScore || 0), 0) / totalGrades).toFixed(1)
    : '0.0'
  
  const passRate = totalGrades > 0
    ? ((grades.filter(g => g.grade !== 'F' && g.grade !== 'Incomplete').length / totalGrades) * 100).toFixed(0) + '%'
    : '0%'
  
  const uniqueCourses = totalGrades > 0
    ? [...new Set(grades.map(g => g.course?._id).filter(Boolean))].length
    : 0

  // Display grades - filtered if search is active
  const displayGrades = filteredGrades

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
          <p className="text-gray-600">
            {searchTerm ? (
              <span>
                Showing {filteredGrades.length} of {grades.length} grades
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            ) : (
              `Record and manage student grades for ${academicYear} - ${term}`
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
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => showToast.info('Export feature coming soon')}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Grade
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
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredGrades.length} results
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

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student name or course..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Grades</p>
              <p className="text-2xl font-bold">{totalGrades}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold">{averageScore}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold">{passRate}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Courses</p>
              <p className="text-2xl font-bold">{uniqueCourses}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grades Grid */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading grades...</p>
          </div>
        ) : !Array.isArray(displayGrades) || displayGrades.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <BarChart className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No grades found' : `No grades found for ${academicYear} - ${term}`}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No grades found for "${searchTerm}". Try a different search term.`
                : 'Get started by adding your first grade record'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add First Grade
              </Button>
            )}
            {(searchTerm || academicYear !== new Date().getFullYear().toString() || term !== 'Term 1') && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setAcademicYear(new Date().getFullYear().toString())
                  setTerm('Term 1')
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayGrades.map((grade) => {
              const studentName = `${grade.student?.firstName || ''} ${grade.student?.lastName || ''}`.trim()
              const courseName = grade.course?.name || 'Unknown Course'
              const courseCode = grade.course?.code || ''
              const totalScore = grade.totalScore || 0
              
              return (
                <div key={grade._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{studentName}</h3>
                          <p className="text-sm text-gray-600 truncate">
                            {grade.student?.studentId || 'No ID'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => {
                          setEditingGrade(grade)
                          setFormData({
                            student: grade.student?._id || '',
                            course: grade.course?._id || '',
                            academicYear: grade.academicYear || new Date().getFullYear().toString(),
                            term: grade.term || 'Term 1',
                            scores: {
                              opener: grade.scores?.opener?.toString() || '',
                              midterm: grade.scores?.midterm?.toString() || '',
                              final: grade.scores?.final?.toString() || ''
                            },
                            teacher: grade.teacher?._id || '',
                            comments: grade.comments || ''
                          })
                          setIsModalOpen(true)
                        }} 
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(grade._id)} 
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span><strong>Course:</strong> {courseName} ({courseCode})</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-gray-400" />
                      <span><strong>Total Score:</strong> {totalScore.toFixed(1)} / 100</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span><strong>Grade:</strong></span>
                      <Badge 
                        className={`px-2 py-0.5 font-bold ${getGradeColor(grade.grade)}`}
                      >
                        {grade.grade || 'N/A'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span><strong>Term:</strong> {grade.term} - {grade.academicYear}</span>
                    </div>
                    
                    {grade.scores && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-gray-700">Score Breakdown:</span>
                        <div className="mt-1 text-xs text-gray-500 grid grid-cols-3 gap-1">
                          <span>Opener: {grade.scores.opener || 0}</span>
                          <span>Midterm: {grade.scores.midterm || 0}</span>
                          <span>Final: {grade.scores.final || 0}</span>
                        </div>
                      </div>
                    )}
                    
                    {grade.comments && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-gray-700">Comments:</span>
                        <p className="mt-1 text-xs text-gray-500">{grade.comments}</p>
                      </div>
                    )}
                  </div>
                  
                  {grade.createdAt && (
                    <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                      Recorded: {new Date(grade.createdAt).toLocaleDateString('en-US', {
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
          setEditingGrade(null)
          resetForm()
        }}
        closeOnBackdropClick={false}
        title={editingGrade ? 'Edit Grade' : 'Add New Grade'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>
              <select
                required
                value={formData.student}
                onChange={(e) => setFormData({...formData, student: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select student</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} - {student.studentId || student._id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course *
              </label>
              <select
                required
                value={formData.course}
                onChange={(e) => setFormData({...formData, course: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year *
              </label>
              <select
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term *
              </label>
              <select
                required
                value={formData.term}
                onChange={(e) => setFormData({...formData, term: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Scores (0-100)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Opener Exam"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0-100"
                value={formData.scores.opener}
                onChange={(e) => setFormData({
                  ...formData,
                  scores: { ...formData.scores, opener: e.target.value }
                })}
              />
              <Input
                label="Midterm Exam"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0-100"
                value={formData.scores.midterm}
                onChange={(e) => setFormData({
                  ...formData,
                  scores: { ...formData.scores, midterm: e.target.value }
                })}
              />
              <Input
                label="Final Exam"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0-100"
                value={formData.scores.final}
                onChange={(e) => setFormData({
                  ...formData,
                  scores: { ...formData.scores, final: e.target.value }
                })}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <strong>Note:</strong> Total score and grade will be calculated automatically.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments (Optional)
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Add any comments about this grade..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingGrade(null)
                resetForm()
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