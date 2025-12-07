import { useState, useEffect } from 'react'
import { Search, Plus, Briefcase, User, Mail, Phone, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { STAFF_POSITIONS } from '@shared'
import { adminApi } from '../services/adminApi'

const Staff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [departments, setDepartments] = useState([])
  const [formData, setFormData] = useState({
    employeeId: '',
    position: '',
    department: '',
    hireDate: '',
    salary: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [staffRes, deptRes] = await Promise.all([
        adminApi.getStaff(),
        adminApi.getDepartments()
      ])
      setStaff(staffRes.data || staffRes || [])
      setDepartments(deptRes.data || deptRes || [])
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
      const staffData = {
        employeeId: formData.employeeId.trim(),
        position: formData.position,
        department: formData.department,
        hireDate: formData.hireDate,
        salary: formData.salary ? parseFloat(formData.salary) : 0
      }

      if (editingStaff) {
        await adminApi.updateStaff(editingStaff._id, staffData)
        showToast.success('Staff updated successfully')
      } else {
        showToast.info('Note: Staff creation requires a user account first')
        // In production, you'd create a user first then staff
        setIsModalOpen(false)
        setEditingStaff(null)
      }
      
      setFormData({
        employeeId: '',
        position: '',
        department: '',
        hireDate: '',
        salary: ''
      })
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await adminApi.deleteStaff(staffId)
        showToast.success('Staff deleted successfully')
        fetchData()
      } catch (error) {
        showToast.error('Failed to delete staff', error.data?.message || error.message)
      }
    }
  }

  const columns = [
    {
      key: 'user',
      title: 'Staff Member',
      render: (_, staffMember) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {staffMember.user?.firstName} {staffMember.user?.lastName}
            </div>
            <div className="text-sm text-gray-500">
              ID: {staffMember.employeeId}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'position',
      title: 'Position',
      render: (position) => (
        <div className="text-gray-900">{position}</div>
      )
    },
    {
      key: 'department',
      title: 'Department',
      render: (dept) => (
        <div className="text-gray-900">{dept?.name || 'N/A'}</div>
      )
    },
    {
      key: 'user.email',
      title: 'Contact',
      render: (_, staffMember) => (
        <div>
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="w-3 h-3 mr-1" />
            {staffMember.user?.email || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Phone className="w-3 h-3 mr-1" />
            {staffMember.user?.profile?.phone || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'hireDate',
      title: 'Hire Date',
      render: (date) => (
        <div className="text-gray-900">
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, staffMember) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingStaff(staffMember)
              setFormData({
                employeeId: staffMember.employeeId || '',
                position: staffMember.position || '',
                department: staffMember.department?._id || '',
                hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : '',
                salary: staffMember.salary?.toString() || ''
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(staffMember._id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage school staff and personnel</p>
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
              setEditingStaff(null)
              setFormData({
                employeeId: '',
                position: '',
                department: '',
                hireDate: '',
                salary: ''
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Teachers</p>
              <p className="text-2xl font-bold">
                {staff.filter(s => s.position?.toLowerCase().includes('teacher')).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Administrative</p>
              <p className="text-2xl font-bold">
                {staff.filter(s => 
                  s.position?.toLowerCase().includes('admin') || 
                  s.position?.toLowerCase().includes('secretary') ||
                  s.position?.toLowerCase().includes('accountant')
                ).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Support Staff</p>
              <p className="text-2xl font-bold">
                {staff.filter(s => 
                  s.position?.toLowerCase().includes('driver') || 
                  s.position?.toLowerCase().includes('cleaner') ||
                  s.position?.toLowerCase().includes('security')
                ).length}
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
            placeholder="Search staff by name, position, or employee ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Staff Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="py-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No staff members found</p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={staff.filter(staffMember => 
              !searchTerm || 
              `${staffMember.user?.firstName} ${staffMember.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
              staffMember.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              staffMember.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            keyField="_id"
            emptyMessage="No staff match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
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
          <Input
            label="Employee ID"
            required
            placeholder="e.g., EMP001"
            value={formData.employeeId}
            onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
          />

          <Select
            label="Position"
            required
            options={[
              { value: '', label: 'Select position' },
              ...STAFF_POSITIONS.map(pos => ({ value: pos, label: pos }))
            ]}
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
          />

          <Select
            label="Department"
            options={[
              { value: '', label: 'Select department' },
              ...departments.map(dept => ({
                value: dept._id,
                label: dept.name
              }))
            ]}
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hire Date"
              type="date"
              value={formData.hireDate}
              onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
            />
            <Input
              label="Salary"
              type="number"
              placeholder="Monthly salary"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
            />
          </div>

          {!editingStaff && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Staff members require a user account first. 
                Please create the user account in the Users section before adding staff details.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingStaff(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Staff