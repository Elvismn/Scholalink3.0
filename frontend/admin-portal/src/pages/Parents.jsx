import { useState, useEffect } from 'react'
import { Search, Plus, Filter, User, Phone, Mail, Edit, Trash2, Eye } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast } from '@shared'
import { adminApi } from '../services/adminApi'

const Parents = () => {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingParent, setEditingParent] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    emergencyContact: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchParents()
  }, [])

  const fetchParents = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getParents()
      setParents(response.data || response)
    } catch (error) {
      showToast.error('Failed to load parents', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingParent) {
        await adminApi.updateParent(editingParent.id, formData)
      } else {
        await adminApi.createParent(formData)
      }
      setIsModalOpen(false)
      setEditingParent(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        occupation: '',
        emergencyContact: '',
        status: 'Active'
      })
      fetchParents()
    } catch (error) {
      showToast.error('Operation failed', error.message)
    }
  }

  const handleEdit = (parent) => {
    setEditingParent(parent)
    setFormData({
      firstName: parent.firstName || '',
      lastName: parent.lastName || '',
      email: parent.email || '',
      phone: parent.phone || '',
      address: parent.address || '',
      occupation: parent.occupation || '',
      emergencyContact: parent.emergencyContact || '',
      status: parent.status || 'Active'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (parentId) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      try {
        await adminApi.deleteParent(parentId)
        fetchParents()
      } catch (error) {
        showToast.error('Failed to delete parent', error.message)
      }
    }
  }

  const filteredParents = parents.filter(parent => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      (parent.firstName?.toLowerCase().includes(searchLower)) ||
      (parent.lastName?.toLowerCase().includes(searchLower)) ||
      (parent.email?.toLowerCase().includes(searchLower)) ||
      (parent.phone?.includes(searchTerm))
    )
  })

  const columns = [
    {
      key: 'name',
      title: 'Parent Name',
      render: (_, parent) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{parent.firstName} {parent.lastName}</div>
            <div className="text-sm text-gray-500">ID: {parent.parentId || `PAR${parent.id?.toString().padStart(4, '0')}`}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Contact Information',
      render: (_, parent) => (
        <div>
          <div className="flex items-center gap-1 text-gray-900">
            <Phone className="h-3 w-3" />
            <span>{parent.phone}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Mail className="h-3 w-3" />
            <span>{parent.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'occupation',
      title: 'Occupation',
      render: (occupation) => <div className="text-gray-900">{occupation || 'Not specified'}</div>
    },
    {
      key: 'childrenCount',
      title: 'Children',
      render: (_, parent) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{parent.childrenCount || parent.children?.length || 0}</div>
          <div className="text-xs text-gray-500">children</div>
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
      render: (_, parent) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(parent)}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(parent.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Parents Management</h1>
          <p className="text-gray-600">Manage parent records and information</p>
        </div>
        <Button
          onClick={() => {
            setEditingParent(null)
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              address: '',
              occupation: '',
              emergencyContact: '',
              status: 'Active'
            })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Parent
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
                placeholder="Search parents by name, email, or phone..."
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
          />
          <Button variant="secondary" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Parents Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredParents}
          keyField="id"
          loading={loading}
          emptyMessage="No parents found"
        />
      </Card>

      {/* Add/Edit Parent Modal */}
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
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <Input
            label="Occupation"
            value={formData.occupation}
            onChange={(e) => setFormData({...formData, occupation: e.target.value})}
          />

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />

          <Input
            label="Emergency Contact"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
            placeholder="Name and phone of emergency contact"
          />

          <Select
            label="Status"
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setEditingParent(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingParent ? 'Update Parent' : 'Add Parent'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Parents
