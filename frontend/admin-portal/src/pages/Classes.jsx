import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Plus, Users, GraduationCap, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button, Modal, Input, Card, showToast, Loader } from '@shared'
import { GRADE_LEVELS } from '@shared'
import { adminApi } from '../services/adminApi'

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

const Classes = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: '',
    classTeacher: '',
    capacity: '30'
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      console.log('🔍 Classes - Fetching data...')
      const [classesRes, teachersRes] = await Promise.all([
        adminApi.getClassrooms(),
        adminApi.getStaff()
      ])
      
      console.log('✅ Classes - Data received:', classesRes)
      
      // Use same normalizeArray as Departments.jsx
      const normalizeArray = (res) => {
        if (!res) return []
        if (Array.isArray(res)) return res
        if (res.data) {
          if (Array.isArray(res.data.classrooms)) return res.data.classrooms
          if (Array.isArray(res.data.staff)) return res.data.staff
          if (Array.isArray(res.data)) return res.data
        }
        return []
      }

      const classesData = normalizeArray(classesRes)
      const teachersData = normalizeArray(teachersRes)
      
      console.log('✅ Normalized Classes:', classesData)
      console.log('✅ Normalized Teachers:', teachersData)
      
      setClasses(classesData)
      setTeachers(teachersData)
      
      setError('')
    } catch (error) {
      console.error('❌ Classes - Error fetching data:', error)
      setError('Failed to load data. Please check your connection and try again.')
      showToast.error('Failed to load data', error.data?.message || error.message)
      setClasses([])
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredClasses = useMemo(() => {
    if (!Array.isArray(classes)) return []
    if (!searchTerm) return classes
    
    const searchLower = searchTerm.toLowerCase()
    
    return classes.filter(cls => {
      if (!cls) return false
      
      const className = cls.name?.toLowerCase() || ''
      const gradeLevel = cls.gradeLevel?.toLowerCase() || ''
      // FIXED: Access staff user name correctly
      const teacherName = `${cls.classTeacher?.user?.firstName || ''} ${cls.classTeacher?.user?.lastName || ''}`.toLowerCase()
      
      return (
        className.includes(searchLower) ||
        gradeLevel.includes(searchLower) ||
        teacherName.includes(searchLower)
      )
    })
  }, [classes, searchTerm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const classData = {
        name: formData.name.trim(),
        gradeLevel: formData.gradeLevel,
        capacity: parseInt(formData.capacity) || 30
      }

      // Only include classTeacher if selected
      if (formData.classTeacher && formData.classTeacher.trim() !== '') {
        classData.classTeacher = formData.classTeacher
      }

      console.log('💾 Classes - Saving class:', editingClass ? 'UPDATE' : 'CREATE', classData)

      if (editingClass) {
        await adminApi.updateClassroom(editingClass._id, classData)
        showToast.success('Class updated successfully')
      } else {
        await adminApi.createClassroom(classData)
        showToast.success('Class created successfully')
      }
      
      await fetchData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Classes - Error saving class:', error)
      setError('Failed to save class. Please try again.')
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
        console.error('❌ Classes - Error deleting class:', error)
        setError('Failed to delete class. Please try again.')
        showToast.error('Failed to delete class', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      gradeLevel: '',
      classTeacher: '',
      capacity: '30'
    })
    setEditingClass(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const totalClasses = classes.length || 0
  const totalStudents = Array.isArray(classes) 
    ? classes.reduce((total, cls) => total + (Array.isArray(cls.students) ? cls.students.length : 0), 0)
    : 0
  const classTeachersCount = Array.isArray(classes)
    ? [...new Set(classes.map(c => c.classTeacher?._id).filter(Boolean))].length
    : 0
  const displayClasses = filteredClasses

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600">
            {searchTerm ? `Showing ${filteredClasses.length} of ${classes.length} classes` : 'Manage classrooms and class assignments'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Class
          </Button>
        </div>
      </div>

      {searchTerm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700">
              Searching for: <strong>"{searchTerm}"</strong> - Found {filteredClasses.length} results
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right text-red-800 font-bold px-2">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold">{totalClasses}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Class Teachers</p>
              <p className="text-2xl font-bold">{classTeachersCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search classes by name, grade, or teacher..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading classes...</p>
          </div>
        ) : !Array.isArray(displayClasses) || displayClasses.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <GraduationCap className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No classes found' : 'No classes yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm ? `No classes found for "${searchTerm}". Try a different search term.` : 'Get started by creating your first class'}
            </p>
            {!searchTerm && (
              <Button onClick={openCreateModal} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Create First Class
              </Button>
            )}
            {searchTerm && (
              <Button variant="link" onClick={() => setSearchTerm('')} className="mt-4">
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayClasses.map((cls) => {
              const studentsCount = Array.isArray(cls.students) ? cls.students.length : 0
              // FIXED: Access staff user name correctly
              const teacherName = cls.classTeacher 
                ? `${cls.classTeacher.user?.firstName || ''} ${cls.classTeacher.user?.lastName || ''}`.trim()
                : 'No teacher assigned'
              
              return (
                <div key={cls._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{cls.name}</h3>
                          <p className="text-sm text-gray-600 truncate">Grade: {cls.gradeLevel || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <button onClick={() => {
                        setEditingClass(cls)
                        setFormData({
                          name: cls.name || '',
                          gradeLevel: cls.gradeLevel || '',
                          classTeacher: cls.classTeacher?._id || '',
                          capacity: cls.capacity?.toString() || '30'
                        })
                        setIsModalOpen(true)
                      }} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cls._id)} className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span><strong>Students:</strong> {studentsCount}/{cls.capacity || 0}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Teacher:</span>
                      <Badge variant="info">{teacherName}</Badge>
                    </div>
                    
                    {cls.classTeacher?.position && (
                      <div className="flex items-center gap-2">
                        <span><strong>Position:</strong> {cls.classTeacher.position}</span>
                      </div>
                    )}
                    
                    {cls.gradeLevel && (
                      <div className="flex items-center gap-2">
                        <span><strong>Grade Level:</strong> {cls.gradeLevel}</span>
                      </div>
                    )}
                  </div>
                  
                  {cls.createdAt && (
                    <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                      Created: {new Date(cls.createdAt).toLocaleDateString('en-US', {
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingClass(null); resetForm(); }} title={editingClass ? 'Edit Class' : 'Add New Class'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Class Name *" required placeholder="e.g., Form 1A" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
              <select required value={formData.gradeLevel} onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select grade level</option>
                {GRADE_LEVELS.map(grade => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher</label>
            <select value={formData.classTeacher} onChange={(e) => setFormData({...formData, classTeacher: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a teacher</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.user?.firstName || 'Unknown'} {teacher.user?.lastName || ''} - {teacher.position || 'Staff'}
                </option>
              ))}
            </select>
          </div>

          <Input label="Capacity *" type="number" required min="1" max="60" placeholder="Maximum number of students" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} />

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => { setIsModalOpen(false); setEditingClass(null); resetForm(); }}>
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