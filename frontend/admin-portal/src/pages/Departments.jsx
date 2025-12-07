import { useState, useEffect } from 'react'
import { Search, Plus, Building, Users, DollarSign, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

const Departments = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [staff, setStaff] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    head: '',
    description: '',
    contactEmail: '',
    budget: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [deptRes, staffRes] = await Promise.all([
        adminApi.getDepartments(),
        adminApi.getStaff()
      ])
      setDepartments(deptRes.data || deptRes || [])
      setStaff(staffRes.data || staffRes || [])
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
      const deptData = {
        name: formData.name.trim(),
        head: formData.head,
        description: formData.description.trim(),
        contactEmail: formData.contactEmail.trim(),
        budget: formData.budget ? parseFloat(formData.budget) : 0
      }

      if (editingDept) {
        await adminApi.updateDepartment(editingDept._id, deptData)
        showToast.success('Department updated successfully')
      } else {
        await adminApi.createDepartment(deptData)
        showToast.success('Department created successfully')
      }
      
      setIsModalOpen(false)
      setEditingDept(null)
      setFormData({
        name: '',
        head: '',
        description: '',
        contactEmail: '',
        budget: ''
      })
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (deptId) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await adminApi.deleteDepartment(deptId)
        showToast.success('Department deleted successfully')
        fetchData()
      } catch (error) {
        showToast.error('Failed to delete department', error.data?.message || error.message)
      }
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Department',
      render: (name, dept) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">{dept.description || 'No description'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'head',
      title: 'Head of Department',
      render: (head) => (
        <div>
          <div className="font-medium text-gray-900">
            {head?.firstName} {head?.lastName}
          </div>
          <div className="text-sm text-gray-500">{head?.position || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'contactEmail',
      title: 'Contact',
      render: (email) => (
        <div className="text-gray-900">{email || 'N/A'}</div>
      )
    },
    {
      key: 'budget',
      title: 'Budget',
      render: (budget) => (
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
          <span className="font-medium">{budget?.toLocaleString() || '0'}</span>
          <span className="text-sm text-gray-500 ml-1">KES</span>
        </div>
      )
    },
    {
      key: 'staffCount',
      title: 'Staff',
      render: (_, dept) => (
        <div className="flex items-center">
          <Users className="w-4 h-4 text-gray-400 mr-1" />
          <span className="font-medium">{dept.staffCount || 0}</span>
          <span className="text-sm text-gray-500 ml-1">members</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, dept) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingDept(dept)
              setFormData({
                name: dept.name || '',
                head: dept.head?._id || '',
                description: dept.description || '',
                contactEmail: dept.contactEmail || '',
                budget: dept.budget?.toString() || ''
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(dept._id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600">Manage school departments and leadership</p>
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
              setEditingDept(null)
              setFormData({
                name: '',
                head: '',
                description: '',
                contactEmail: '',
                budget: ''
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold">{departments.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold">
                {departments.reduce((total, dept) => total + (dept.staffCount || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold">
                KES {departments.reduce((total, dept) => total + (dept.budget || 0), 0).toLocaleString()}
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
              <p className="text-sm text-gray-600">Average Staff</p>
              <p className="text-2xl font-bold">
                {departments.length > 0 
                  ? (departments.reduce((total, dept) => total + (dept.staffCount || 0), 0) / departments.length).toFixed(1)
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
            placeholder="Search departments by name or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Departments Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="py-12 text-center">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No departments found</p>
            <Button
              onClick={() => {
                setFormData({
                  name: '',
                  head: '',
                  description: '',
                  contactEmail: '',
                  budget: ''
                })
                setIsModalOpen(true)
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Department
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={departments.filter(dept => 
              !searchTerm || 
              dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              dept.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            keyField="_id"
            emptyMessage="No departments match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingDept(null)
        }}
        title={editingDept ? 'Edit Department' : 'Add New Department'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            required
            placeholder="e.g., Mathematics Department"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />

          <Select
            label="Head of Department"
            options={[
              { value: '', label: 'Select HoD' },
              ...staff.map(staffMember => ({
                value: staffMember._id,
                label: `${staffMember.user?.firstName} ${staffMember.user?.lastName} - ${staffMember.position}`
              }))
            ]}
            value={formData.head}
            onChange={(e) => setFormData({...formData, head: e.target.value})}
          />

          <Input
            label="Contact Email"
            type="email"
            placeholder="department@school.com"
            value={formData.contactEmail}
            onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Annual Budget (KES)"
              type="number"
              min="0"
              placeholder="Budget amount"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the department..."
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
                setEditingDept(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingDept ? 'Update Department' : 'Add Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Departments