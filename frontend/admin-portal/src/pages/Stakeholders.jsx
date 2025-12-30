import { useState, useEffect } from 'react'
import { Search, Plus, Users, Mail, Phone, Building, Handshake, Edit, Trash2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

const Stakeholders = () => {
  const [stakeholders, setStakeholders] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Partner',
    contact: '',
    email: '',
    organization: '',
    contribution: '',
    status: 'Active',
    notes: ''
  })

  const stakeholderTypes = ['Distributor', 'Collaborator', 'Wellwisher', 'Sponsor', 'Partner']
  const statuses = ['Active', 'Inactive', 'Pending']

  useEffect(() => {
    fetchStakeholders()
  }, [])

  const fetchStakeholders = async () => {
    setLoading(true)
    try {
      console.log('🔍 Stakeholders - Fetching data...')
      const response = await adminApi.getStakeholders()
      
      // Handle response - FIXED: Backend returns data.stakeholders
      let stakeholdersData = []
      if (response && response.data) {
        if (Array.isArray(response.data.stakeholders)) {
          stakeholdersData = response.data.stakeholders
        } else if (Array.isArray(response.data)) {
          stakeholdersData = response.data
        }
      }
      setStakeholders(stakeholdersData || [])
      
      console.log('✅ Stakeholders - Data received:', stakeholdersData.length, 'stakeholders')
    } catch (error) {
      console.error('❌ Stakeholders - Error fetching data:', error)
      showToast.error('Failed to load stakeholders', error.data?.message || error.message)
      setStakeholders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const stakeholderData = {
        name: formData.name.trim(),
        type: formData.type,
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        organization: formData.organization.trim(),
        contribution: formData.contribution.trim(),
        status: formData.status,
        notes: formData.notes.trim()
      }

      console.log('💾 Stakeholders - Saving stakeholder:', editingStakeholder ? 'update' : 'create')
      console.log('📋 Stakeholder data:', stakeholderData)

      if (editingStakeholder) {
        await adminApi.updateStakeholder(editingStakeholder._id, stakeholderData)
        showToast.success('Stakeholder updated successfully')
      } else {
        await adminApi.createStakeholder(stakeholderData)
        showToast.success('Stakeholder created successfully')
      }
      
      setIsModalOpen(false)
      resetForm()
      fetchStakeholders()
    } catch (error) {
      console.error('❌ Stakeholders - Error saving stakeholder:', error)
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (stakeholderId) => {
    if (window.confirm('Are you sure you want to delete this stakeholder?')) {
      try {
        console.log('🗑️ Stakeholders - Deleting stakeholder:', stakeholderId)
        await adminApi.deleteStakeholder(stakeholderId)
        showToast.success('Stakeholder deleted successfully')
        fetchStakeholders()
      } catch (error) {
        console.error('❌ Stakeholders - Error deleting stakeholder:', error)
        showToast.error('Failed to delete stakeholder', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Partner',
      contact: '',
      email: '',
      organization: '',
      contribution: '',
      status: 'Active',
      notes: ''
    })
    setEditingStakeholder(null)
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sponsor': return 'bg-purple-100 text-purple-800'
      case 'Partner': return 'bg-blue-100 text-blue-800'
      case 'Distributor': return 'bg-green-100 text-green-800'
      case 'Collaborator': return 'bg-yellow-100 text-yellow-800'
      case 'Wellwisher': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <TrendingUp className="w-3 h-3 text-green-500" />
      case 'Inactive': return <TrendingDown className="w-3 h-3 text-red-500" />
      case 'Pending': return <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      default: return null
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Stakeholder',
      render: (name, stakeholder) => (
        <div className="flex items-center">
          <div className={`rounded-lg p-2 mr-3 ${
            stakeholder.type === 'Sponsor' ? 'bg-purple-100' : 
            stakeholder.type === 'Partner' ? 'bg-blue-100' :
            stakeholder.type === 'Distributor' ? 'bg-green-100' :
            stakeholder.type === 'Collaborator' ? 'bg-yellow-100' : 'bg-pink-100'
          }`}>
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">{stakeholder.organization || 'Individual'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (type) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(type)}`}>
          {type}
        </span>
      )
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (_, stakeholder) => (
        <div>
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="w-3 h-3 mr-1" />
            {stakeholder.email || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Phone className="w-3 h-3 mr-1" />
            {stakeholder.contact || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'contribution',
      title: 'Contribution',
      render: (contribution) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {contribution || 'No contribution specified'}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => (
        <div className="flex items-center">
          {getStatusIcon(status)}
          <span className={`ml-2 text-sm font-medium ${
            status === 'Active' ? 'text-green-700' :
            status === 'Inactive' ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {status}
          </span>
        </div>
      )
    },
    {
      key: 'relationshipStart',
      title: 'Since',
      render: (date) => (
        <div className="text-sm text-gray-500">
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, stakeholder) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingStakeholder(stakeholder)
              setFormData({
                name: stakeholder.name || '',
                type: stakeholder.type || 'Partner',
                contact: stakeholder.contact || '',
                email: stakeholder.email || '',
                organization: stakeholder.organization || '',
                contribution: stakeholder.contribution || '',
                status: stakeholder.status || 'Active',
                notes: stakeholder.notes || ''
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(stakeholder._id)}
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  const filteredStakeholders = stakeholders.filter(stakeholder => {
    if (!searchTerm && typeFilter === 'all' && statusFilter === 'all') return true
    
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = searchTerm ? (
      stakeholder.name?.toLowerCase().includes(searchLower) ||
      stakeholder.email?.toLowerCase().includes(searchLower) ||
      stakeholder.organization?.toLowerCase().includes(searchLower) ||
      stakeholder.contribution?.toLowerCase().includes(searchLower) ||
      stakeholder.notes?.toLowerCase().includes(searchLower)
    ) : true
    
    const matchesType = typeFilter === 'all' || stakeholder.type === typeFilter
    const matchesStatus = statusFilter === 'all' || stakeholder.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  const activeStakeholders = stakeholders.filter(s => s.status === 'Active').length
  const partnerCount = stakeholders.filter(s => s.type === 'Partner').length
  const sponsorCount = stakeholders.filter(s => s.type === 'Sponsor').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stakeholders</h1>
          <p className="text-gray-600">Manage school partners, sponsors, and collaborators</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchStakeholders}
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
            Add Stakeholder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Stakeholders</p>
              <p className="text-2xl font-bold">{stakeholders.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{activeStakeholders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <Handshake className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Partners</p>
              <p className="text-2xl font-bold">{partnerCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Sponsors</p>
              <p className="text-2xl font-bold">{sponsorCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stakeholders by name, organization, or contribution..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              ...stakeholderTypes.map(type => ({ value: type, label: type }))
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              ...statuses.map(status => ({ value: status, label: status }))
            ]}
          />
        </div>
      </Card>

      {/* Stakeholders Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading stakeholders...</p>
          </div>
        ) : filteredStakeholders.length === 0 ? (
          <div className="py-12 text-center">
            <Handshake className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No stakeholders found</p>
            {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') ? (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
                  setStatusFilter('all')
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={() => {
                  resetForm()
                  setIsModalOpen(true)
                }}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Stakeholder
              </Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredStakeholders}
            keyField="_id"
            emptyMessage="No stakeholders match your search"
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
        title={editingStakeholder ? 'Edit Stakeholder' : 'Add New Stakeholder'}
        size="lg"
        closeOnBackdropClick={false}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name *"
              required
              placeholder="e.g., John Doe or Company Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Select
              label="Type *"
              required
              options={stakeholderTypes.map(type => ({ value: type, label: type }))}
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Input
              label="Contact Phone"
              placeholder="+254 712 345 678"
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
            />
          </div>

          <Input
            label="Organization"
            placeholder="Company or institution name"
            value={formData.organization}
            onChange={(e) => setFormData({...formData, organization: e.target.value})}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Contribution
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the stakeholder's contribution, support, or partnership..."
              value={formData.contribution}
              onChange={(e) => setFormData({...formData, contribution: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or comments..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <Select
            label="Status"
            options={statuses.map(status => ({ value: status, label: status }))}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />

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
            <Button type="submit" loading={submitting}>
              {editingStakeholder ? 'Update Stakeholder' : 'Add Stakeholder'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Stakeholders