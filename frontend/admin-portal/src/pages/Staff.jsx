import { useState, useEffect } from 'react'
import { Search, Plus, Filter, Briefcase, Mail, Phone, Edit, Trash2, Eye } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast } from '@shared'
import { STAFF_POSITIONS } from '@shared'
import { adminApi } from '../services/adminApi'

const Staff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    employeeId: '',
    department: '',
    hireDate: '',
    salary: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getStaff()
      setStaff(response.data || response)
    } catch (error) {
      showToast.error('Failed to load staff', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingStaff) {
        await adminApi.updateStaff(editingStaff.id, formData)
      } else {
        await adminApi.createStaff(formData)
      }
      setIsModalOpen(false)
      setEditingStaff(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        employeeId: '',
        department: '',
        hireDate: '',
        salary: '',
        status: 'Active'
      })
      fetchStaff()
    } catch (error) {
      showToast.error('Operation failed', error.message)
    }
  }

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember)
    setFormData({
      firstName: staffMember.firstName || '',
      lastName: staffMember.lastName || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      position: staffMember.position || '',
      employeeId: staffMember.employeeId || '',
      department: staffMember.department || '',
      hireDate: staffMember.hireDate || '',
      salary: staffMember.salary || '',
      status: staffMember.status || 'Active'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await adminApi.deleteStaff(staffId)
        fetchStaff()
      } catch (error) {
        showToast.error('Failed to delete staff member', error.message)
      }
    }
  }

  const filteredStaff = staff.filter(staffMember => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      (staffMember.firstName?.toLowerCase().includes(searchLower)) ||
      (staffMember.lastName?.toLowerCase().includes(searchLower)) ||
      (staffMember.email?.toLowerCase().includes(searchLower)) ||
      (staffMember.position?.toLowerCase().includes(searchLower)) ||
      (staffMember.employeeId?.toLowerCase().includes(searchLower))
    )
  })

  const columns = [
    {
      key: 'name',
      title: 'Staff Member',
      render: (_, staffMember) => (
        <div className="flex items-center">
          <div className="bg-purple-100 rounded-full p-2 mr-3">
            <Briefcase className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{staffMember.firstName} {staffMember.lastName}</div>
            <div className="text-sm text-gray-500">ID: {staffMember.employeeId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'position',
      title: 'Position',
      render: (position) => <div className="text-gray-900">{position}</div>
    },
    {
      key: 'contact',
      title: 'Contact Information',
      render: (_, staffMember) => (
        <div>
          <div className="flex items-center gap-1 text-gray-900">
            <Mail className="h-3 w-3" />
            <span>{staffMember.email}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Phone className="h-3 w-3" />
            <span>{staffMember.phone}</span>
          </div>
        </div>
      )
    },
    {
      key: 'department',
      title: 'Department',
      render: (department) => <div className="text-gray-900">{department || 'Not assigned'}</div>
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
      render: (_, staffMember) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(staffMember)}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(staffMember.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage school staff and faculty</p>
        </div>
        <Button
          onClick={() => {
            setEditingStaff(null)
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              position: '',
              employeeId: '',
              department: '',
              hireDate: '',
              salary: '',
              status: 'Active'
            })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Staff
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
                placeholder="Search staff by name, position, or employee ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select
            placeholder="Filter by position"
            options={STAFF_POSITIONS.map(position => ({ value: position, label: position }))}
            className="w-full md:w-48"
          />
          <Button variant="secondary" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Staff Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredStaff}
          keyField="id"
          loading={loading}
          emptyMessage="No staff members found"
        />
      </Card>

      {/* Add/Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingStaff(null)
        }}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Position"
              required
              options={STAFF_POSITIONS.map(position => ({ value: position, label: position }))}
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
            />
            <Input
              label="Employee ID"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              placeholder="e.g., EMP001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
            <Input
              label="Hire Date"
              type="date"
              value={formData.hireDate}
              onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
            />
          </div>

          <Input
            label="Salary"
            type="number"
            value={formData.salary}
            onChange={(e) => setFormData({...formData, salary: e.target.value})}
            placeholder="Monthly salary"
          />

          <Select
            label="Status"
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'On Leave', label: 'On Leave' }
            ]}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setEditingStaff(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Staff
