import { useState, useEffect } from 'react'
import { Search, Plus, UserCircle, Users, Mail, Phone, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

const Parents = () => {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingParent, setEditingParent] = useState(null)
  const [students, setStudents] = useState([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    children: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [parentsRes, studentsRes] = await Promise.all([
        adminApi.getParents(),
        adminApi.getStudents()
      ])
      setParents(parentsRes.data || parentsRes || [])
      setStudents(studentsRes.data || studentsRes || [])
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
      const parentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        children: formData.children
      }

      if (editingParent) {
        await adminApi.updateParent(editingParent._id, parentData)
        showToast.success('Parent updated successfully')
      } else {
        // Note: In production, you'd create a user first
        showToast.info('Note: Parent creation requires a user account first')
        setIsModalOpen(false)
        setEditingParent(null)
      }
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        children: []
      })
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (parentId) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      try {
        await adminApi.deleteParent(parentId)
        showToast.success('Parent deleted successfully')
        fetchData()
      } catch (error) {
        showToast.error('Failed to delete parent', error.data?.message || error.message)
      }
    }
  }

  const columns = [
    {
      key: 'user',
      title: 'Parent',
      render: (_, parent) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <UserCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {parent.user?.firstName} {parent.user?.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {parent.user?.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (_, parent) => (
        <div>
          <div className="flex items-center text-sm text-gray-500">
            <Phone className="w-3 h-3 mr-1" />
            {parent.user?.profile?.phone || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Mail className="w-3 h-3 mr-1" />
            {parent.user?.email || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'children',
      title: 'Children',
      render: (children) => (
        <div className="flex items-center">
          <Users className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium">{children?.length || 0}</span>
          <span className="text-sm text-gray-500 ml-1">students</span>
        </div>
      )
    },
    {
      key: 'childrenNames',
      title: 'Student Names',
      render: (_, parent) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {parent.children?.map(child => child.fullName || `${child.firstName} ${child.lastName}`).join(', ') || 'No children assigned'}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, parent) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingParent(parent)
              setFormData({
                firstName: parent.user?.firstName || '',
                lastName: parent.user?.lastName || '',
                email: parent.user?.email || '',
                phone: parent.user?.profile?.phone || '',
                children: parent.children?.map(child => child._id) || []
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(parent._id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Parent Management</h1>
          <p className="text-gray-600">Manage parent accounts and child associations</p>
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
              setEditingParent(null)
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                children: []
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Parent
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Parents</p>
              <p className="text-2xl font-bold">{parents.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students Linked</p>
              <p className="text-2xl font-bold">
                {parents.reduce((total, parent) => total + (parent.children?.length || 0), 0)}
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
              <p className="text-sm text-gray-600">Average Children</p>
              <p className="text-2xl font-bold">
                {parents.length > 0 
                  ? (parents.reduce((total, parent) => total + (parent.children?.length || 0), 0) / parents.length).toFixed(1)
                  : '0.0'
                }
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
            placeholder="Search parents by name, email, or child's name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Parents Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading parents...</p>
          </div>
        ) : parents.length === 0 ? (
          <div className="py-12 text-center">
            <UserCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No parents found</p>
            <Button
              onClick={() => {
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  children: []
                })
                setIsModalOpen(true)
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Parent
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={parents.filter(parent => {
              if (!searchTerm) return true
              const searchLower = searchTerm.toLowerCase()
              const fullName = `${parent.user?.firstName || ''} ${parent.user?.lastName || ''}`.toLowerCase()
              const email = parent.user?.email?.toLowerCase() || ''
              const phone = parent.user?.profile?.phone?.toLowerCase() || ''
              const childrenNames = parent.children?.map(child => 
                `${child.firstName || ''} ${child.lastName || ''}`
              ).join(' ').toLowerCase() || ''
              
              return (
                fullName.includes(searchLower) ||
                email.includes(searchLower) ||
                phone.includes(searchLower) ||
                childrenNames.includes(searchLower)
              )
            })}
            keyField="_id"
            emptyMessage="No parents match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingParent(null)
        }}
        title={editingParent ? 'Edit Parent' : 'Add New Parent'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Input
              label="Phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Children
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No students available</p>
              ) : (
                <div className="space-y-2">
                  {students.map(student => (
                    <label key={student._id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.children.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              children: [...formData.children, student._id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              children: formData.children.filter(id => id !== student._id)
                            })
                          }
                        }}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {student.firstName} {student.lastName} - {student.grade} (ID: {student.studentId})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.children.length > 0 && (
              <p className="text-sm text-gray-500">
                Selected: {formData.children.length} student{formData.children.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {!editingParent && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Parent accounts require a user account first. 
                Please create the user account in the Users section before adding parent details.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingParent(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingParent ? 'Update Parent' : 'Add Parent'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Parents