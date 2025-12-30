import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Building, Users, DollarSign, Edit, Trash2, RefreshCw, Calendar, Wrench, CheckCircle, XCircle, AlertCircle, Car, Clock, FileText } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

// Inline Badge Component
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

const Maintenance = () => {
  const [maintenance, setMaintenance] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState(null)
  const [error, setError] = useState('')
  
  // Form data matching backend schema - FIXED: Added missing fields
  const [formData, setFormData] = useState({
    vehicle: '',
    date: new Date().toISOString().split('T')[0],
    type: 'routine_service',
    description: '',
    cost: '',
    garage: '',
    garageContact: {
      phone: '',
      email: '',
      address: ''
    },
    receiptNumber: '',
    odometerReading: '',
    partsReplaced: [],
    // ADDED: Next service fields from backend
    nextServiceDate: '',
    nextServiceOdometer: '',
    serviceInterval: '5000',
    // ADDED: Verification fields
    verified: false,
    verifiedBy: '',
    completionDate: '',
    status: 'completed',
    approvedBy: '',
    notes: '',
    warranty: {
      hasWarranty: false,
      warrantyPeriod: '',
      warrantyDetails: ''
    }
  })

  // Parts form data
  const [partsFormData, setPartsFormData] = useState({
    name: '',
    partNumber: '',
    quantity: 1,
    unitCost: '',
    totalCost: ''
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Maintenance - Fetching data...')
      const [maintenanceRes, vehiclesRes, staffRes] = await Promise.all([
        adminApi.getMaintenanceRecords(),
        adminApi.getVehicles(),
        adminApi.getStaff()
      ])
      
      console.log('✅ Maintenance - API responses received')
      
      // FIXED: Handle backend data structure
      let maintenanceData = []
      if (maintenanceRes && maintenanceRes.data) {
        if (Array.isArray(maintenanceRes.data.maintenance)) {
          maintenanceData = maintenanceRes.data.maintenance
        } else if (Array.isArray(maintenanceRes.data)) {
          maintenanceData = maintenanceRes.data
        }
      }
      
      let vehiclesData = []
      if (vehiclesRes && vehiclesRes.data) {
        if (Array.isArray(vehiclesRes.data)) {
          vehiclesData = vehiclesRes.data
        } else if (Array.isArray(vehiclesRes)) {
          vehiclesData = vehiclesRes
        }
      }
      
      let staffData = []
      if (staffRes && staffRes.data) {
        if (Array.isArray(staffRes.data)) {
          staffData = staffRes.data
        } else if (Array.isArray(staffRes)) {
          staffData = staffRes
        }
      }
      
      setMaintenance(maintenanceData || [])
      setVehicles(vehiclesData || [])
      setStaff(staffData || [])
      
      console.log('✅ Maintenance - Data loaded:', {
        maintenance: maintenanceData.length,
        vehicles: vehiclesData.length,
        staff: staffData.length
      })
      
      setError('')
    } catch (error) {
      console.error('❌ Maintenance - Error fetching data:', error)
      setError('Failed to load data. Please check your connection and try again.')
      showToast.error('Failed to load data', error.data?.message || error.message)
      setMaintenance([])
      setVehicles([])
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  // Filter maintenance based on search term and filters
  const filteredMaintenance = useMemo(() => {
    if (!Array.isArray(maintenance)) return []
    if (!searchTerm && statusFilter === 'all' && typeFilter === 'all') return maintenance
    
    const searchLower = searchTerm.toLowerCase()
    
    return maintenance.filter(record => {
      if (!record) return false
      
      // Search filter
      const matchesSearch = searchTerm ? (
        (record.vehicle?.plateNumber?.toLowerCase().includes(searchLower)) ||
        (record.vehicle?.make?.toLowerCase().includes(searchLower)) ||
        (record.vehicle?.model?.toLowerCase().includes(searchLower)) ||
        (record.garage?.toLowerCase().includes(searchLower)) ||
        (record.description?.toLowerCase().includes(searchLower)) ||
        (record.receiptNumber?.toLowerCase().includes(searchLower))
      ) : true
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter
      
      // Type filter
      const matchesType = typeFilter === 'all' || record.type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [maintenance, searchTerm, statusFilter, typeFilter])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGarageContactChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      garageContact: {
        ...prev.garageContact,
        [name]: value
      }
    }))
  }

  const handleWarrantyChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      warranty: {
        ...prev.warranty,
        [name]: type === 'checkbox' ? checked : value
      }
    }))
  }

  const handlePartsInputChange = (e) => {
    const { name, value } = e.target
    const newValue = name === 'quantity' || name === 'unitCost' || name === 'totalCost' 
      ? Number(value) || 0 
      : value
    
    setPartsFormData(prev => ({ 
      ...prev, 
      [name]: newValue 
    }))
    
    // Auto-calculate total cost if unitCost or quantity changes
    if (name === 'unitCost' || name === 'quantity') {
      const unitCost = name === 'unitCost' ? Number(value) || 0 : partsFormData.unitCost || 0
      const quantity = name === 'quantity' ? Number(value) || 1 : partsFormData.quantity || 1
      const totalCost = unitCost * quantity
      setPartsFormData(prev => ({
        ...prev,
        totalCost: totalCost
      }))
    }
  }

  const addPart = () => {
    if (!partsFormData.name.trim()) {
      showToast.error('Part name is required')
      return
    }

    const newPart = {
      name: partsFormData.name.trim(),
      partNumber: partsFormData.partNumber.trim(),
      quantity: partsFormData.quantity || 1,
      unitCost: partsFormData.unitCost || 0,
      totalCost: partsFormData.totalCost || (partsFormData.quantity || 1) * (partsFormData.unitCost || 0)
    }

    setFormData(prev => ({
      ...prev,
      partsReplaced: [...prev.partsReplaced, newPart]
    }))

    // Reset parts form
    setPartsFormData({
      name: '',
      partNumber: '',
      quantity: 1,
      unitCost: '',
      totalCost: ''
    })

    setIsPartsModalOpen(false)
    showToast.success('Part added successfully')
  }

  const removePart = (index) => {
    setFormData(prev => ({
      ...prev,
      partsReplaced: prev.partsReplaced.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Prepare data matching backend schema
      const maintenanceData = {
        vehicle: formData.vehicle,
        date: formData.date,
        type: formData.type,
        description: formData.description.trim(),
        cost: Number(formData.cost) || 0,
        garage: formData.garage.trim(),
        garageContact: {
          phone: formData.garageContact.phone.trim(),
          email: formData.garageContact.email.trim(),
          address: formData.garageContact.address.trim()
        },
        receiptNumber: formData.receiptNumber.trim(),
        odometerReading: Number(formData.odometerReading) || 0,
        partsReplaced: formData.partsReplaced.map(part => ({
          name: part.name,
          partNumber: part.partNumber,
          quantity: Number(part.quantity) || 1,
          unitCost: Number(part.unitCost) || 0,
          totalCost: Number(part.totalCost) || 0
        })),
        // ADDED: Next service fields
        nextServiceDate: formData.nextServiceDate || undefined,
        nextServiceOdometer: formData.nextServiceOdometer ? Number(formData.nextServiceOdometer) : undefined,
        serviceInterval: Number(formData.serviceInterval) || 5000,
        // ADDED: Verification fields
        verified: formData.verified || false,
        verifiedBy: formData.verifiedBy || undefined,
        completionDate: formData.completionDate || undefined,
        status: formData.status,
        approvedBy: formData.approvedBy,
        notes: formData.notes.trim(),
        warranty: {
          hasWarranty: formData.warranty.hasWarranty,
          warrantyPeriod: formData.warranty.warrantyPeriod ? Number(formData.warranty.warrantyPeriod) : undefined,
          warrantyDetails: formData.warranty.warrantyDetails.trim()
        }
      }

      console.log('💾 Maintenance - Saving:', editingMaintenance ? 'UPDATE' : 'CREATE', maintenanceData)

      if (editingMaintenance) {
        await adminApi.updateMaintenanceRecord(editingMaintenance._id, maintenanceData)
        showToast.success('Maintenance record updated successfully')
      } else {
        await adminApi.createMaintenanceRecord(maintenanceData)
        showToast.success('Maintenance record created successfully')
      }
      
      await fetchAllData()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Maintenance - Error saving:', error)
      setError('Failed to save maintenance record. Please try again.')
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (record) => {
    console.log('✏️ Maintenance - Editing record:', record._id)
    setEditingMaintenance(record)
    
    // Populate form from record data
    setFormData({
      vehicle: record.vehicle?._id || record.vehicle || '',
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      type: record.type || 'routine_service',
      description: record.description || '',
      cost: record.cost || '',
      garage: record.garage || '',
      garageContact: record.garageContact || {
        phone: '',
        email: '',
        address: ''
      },
      receiptNumber: record.receiptNumber || '',
      odometerReading: record.odometerReading || '',
      partsReplaced: record.partsReplaced || [],
      // ADDED: Next service fields
      nextServiceDate: record.nextServiceDate ? new Date(record.nextServiceDate).toISOString().split('T')[0] : '',
      nextServiceOdometer: record.nextServiceOdometer || '',
      serviceInterval: record.serviceInterval || '5000',
      // ADDED: Verification fields
      verified: record.verified || false,
      verifiedBy: record.verifiedBy?._id || record.verifiedBy || '',
      completionDate: record.completionDate ? new Date(record.completionDate).toISOString().split('T')[0] : '',
      status: record.status || 'completed',
      approvedBy: record.approvedBy?._id || record.approvedBy || '',
      notes: record.notes || '',
      warranty: record.warranty || {
        hasWarranty: false,
        warrantyPeriod: '',
        warrantyDetails: ''
      }
    })
    
    setIsModalOpen(true)
  }

  const handleDelete = async (maintenanceId) => {
    if (window.confirm('Are you sure you want to delete this maintenance record? This action cannot be undone.')) {
      try {
        console.log('🗑️ Maintenance - Deleting record:', maintenanceId)
        await adminApi.deleteMaintenanceRecord(maintenanceId)
        showToast.success('Maintenance record deleted successfully')
        fetchAllData()
      } catch (error) {
        console.error('❌ Maintenance - Error deleting:', error)
        setError('Failed to delete maintenance record. Please try again.')
        showToast.error('Failed to delete maintenance', error.data?.message || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      vehicle: '',
      date: new Date().toISOString().split('T')[0],
      type: 'routine_service',
      description: '',
      cost: '',
      garage: '',
      garageContact: {
        phone: '',
        email: '',
        address: ''
      },
      receiptNumber: '',
      odometerReading: '',
      partsReplaced: [],
      // ADDED: Next service fields
      nextServiceDate: '',
      nextServiceOdometer: '',
      serviceInterval: '5000',
      // ADDED: Verification fields
      verified: false,
      verifiedBy: '',
      completionDate: '',
      status: 'completed',
      approvedBy: '',
      notes: '',
      warranty: {
        hasWarranty: false,
        warrantyPeriod: '',
        warrantyDetails: ''
      }
    })
    setEditingMaintenance(null)
  }

  const openCreateModal = () => {
    console.log('➕ Maintenance - Opening create modal')
    resetForm()
    setIsModalOpen(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type) => {
    const typeLabels = {
      routine_service: 'Routine Service',
      oil_change: 'Oil Change',
      tire_replacement: 'Tire Replacement',
      brake_repair: 'Brake Repair',
      engine_repair: 'Engine Repair',
      electrical: 'Electrical',
      body_work: 'Body Work',
      accident_repair: 'Accident Repair',
      battery_replacement: 'Battery Replacement',
      other: 'Other'
    }
    return typeLabels[type] || type
  }

  const getStatusLabel = (status) => {
    const statusLabels = {
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
    return statusLabels[status] || status
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  // Calculate total parts cost
  const totalPartsCost = formData.partsReplaced.reduce((total, part) => total + (part.totalCost || 0), 0)

  // Columns for table
  const columns = [
    {
      key: 'vehicle',
      title: 'Vehicle',
      render: (_, record) => (
        <div className="flex items-center">
          <Car className="w-4 h-4 text-gray-400 mr-2" />
          <div>
            <div className="font-medium text-gray-900">
              {record.vehicle?.plateNumber || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              {record.vehicle?.make} {record.vehicle?.model}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'date',
      title: 'Date',
      render: (date) => (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
          <span>{formatDate(date)}</span>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (type) => (
        <Badge variant="info">
          {getTypeLabel(type)}
        </Badge>
      )
    },
    {
      key: 'cost',
      title: 'Cost',
      render: (cost) => (
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium">{formatCurrency(cost)}</span>
        </div>
      )
    },
    {
      key: 'garage',
      title: 'Garage',
      render: (garage) => (
        <div className="flex items-center">
          <Building className="w-4 h-4 text-gray-400 mr-2" />
          <span>{garage}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => (
        <Badge 
          variant={
            status === 'completed' ? 'success' :
            status === 'in_progress' ? 'info' :
            status === 'scheduled' ? 'warning' : 'error'
          }
        >
          {getStatusLabel(status)}
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(record)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(record._id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-600">Manage vehicle maintenance records and service history</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchAllData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Maintenance
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
                Searching for: <strong>"{searchTerm}"</strong> - Found {filteredMaintenance.length} results
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold">{maintenance.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">
                {maintenance.filter(m => m.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold">
                {maintenance.filter(m => m.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold">
                {formatCurrency(maintenance.reduce((total, m) => total + (m.cost || 0), 0))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Card */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by vehicle, garage, description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="routine_service">Routine Service</option>
            <option value="oil_change">Oil Change</option>
            <option value="tire_replacement">Tire Replacement</option>
            <option value="brake_repair">Brake Repair</option>
            <option value="engine_repair">Engine Repair</option>
            <option value="electrical">Electrical</option>
            <option value="body_work">Body Work</option>
            <option value="accident_repair">Accident Repair</option>
            <option value="battery_replacement">Battery Replacement</option>
            <option value="other">Other</option>
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setTypeFilter('all')
            }}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Maintenance Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading maintenance records...</p>
          </div>
        ) : !Array.isArray(filteredMaintenance) || filteredMaintenance.length === 0 ? (
          <div className="py-12 text-center">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No maintenance records found' : 'No maintenance records yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `No maintenance records found for "${searchTerm}". Try a different search term.`
                : 'Get started by adding your first maintenance record'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add First Maintenance Record
              </Button>
            )}
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setTypeFilter('all')
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredMaintenance}
            keyField="_id"
            emptyMessage="No maintenance records match your search"
          />
        )}
      </Card>

      {/* Add/Edit Maintenance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        closeOnBackdropClick={false}
        title={editingMaintenance ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle *
              </label>
              <select
                name="vehicle"
                value={formData.vehicle}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Vehicle</option>
                {Array.isArray(vehicles) && vehicles.map(vehicle => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Date *"
              name="date"
              type="date"
              required
              value={formData.date}
              onChange={handleInputChange}
            />
          </div>

          {/* Type and Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="routine_service">Routine Service</option>
                <option value="oil_change">Oil Change</option>
                <option value="tire_replacement">Tire Replacement</option>
                <option value="brake_repair">Brake Repair</option>
                <option value="engine_repair">Engine Repair</option>
                <option value="electrical">Electrical</option>
                <option value="body_work">Body Work</option>
                <option value="accident_repair">Accident Repair</option>
                <option value="battery_replacement">Battery Replacement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              label="Cost *"
              name="cost"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>

          {/* Garage Information */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Garage Information</h3>
            <Input
              label="Garage Name *"
              name="garage"
              required
              value={formData.garage}
              onChange={handleInputChange}
              placeholder="Garage name"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <Input
                label="Phone"
                name="phone"
                value={formData.garageContact.phone}
                onChange={handleGarageContactChange}
                placeholder="Phone number"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.garageContact.email}
                onChange={handleGarageContactChange}
                placeholder="Email address"
              />
              <Input
                label="Address"
                name="address"
                value={formData.garageContact.address}
                onChange={handleGarageContactChange}
                placeholder="Address"
              />
            </div>
          </div>

          {/* Odometer and Receipt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Odometer Reading (km) *"
              name="odometerReading"
              type="number"
              required
              min="0"
              value={formData.odometerReading}
              onChange={handleInputChange}
              placeholder="Current odometer"
            />
            <Input
              label="Receipt Number"
              name="receiptNumber"
              value={formData.receiptNumber}
              onChange={handleInputChange}
              placeholder="Receipt number"
            />
          </div>

          {/* Next Service Information */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Next Service Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Next Service Date"
                name="nextServiceDate"
                type="date"
                value={formData.nextServiceDate}
                onChange={handleInputChange}
              />
              <Input
                label="Next Service Odometer (km)"
                name="nextServiceOdometer"
                type="number"
                min="0"
                value={formData.nextServiceOdometer}
                onChange={handleInputChange}
                placeholder="Odometer for next service"
              />
              <Input
                label="Service Interval (km) *"
                name="serviceInterval"
                type="number"
                required
                min="100"
                value={formData.serviceInterval}
                onChange={handleInputChange}
                placeholder="Default: 5000"
              />
            </div>
          </div>

          {/* Parts Replaced */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Parts Replaced</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsPartsModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Part
              </Button>
            </div>
            
            {formData.partsReplaced.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No parts added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.partsReplaced.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{part.name}</div>
                      <div className="text-sm text-gray-600">
                        Part No: {part.partNumber || 'N/A'} • Qty: {part.quantity} • Unit: {formatCurrency(part.unitCost)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        Total: {formatCurrency(part.totalCost)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePart(index)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="text-right text-sm font-medium text-gray-900 pt-2 border-t">
                  Total Parts Cost: {formatCurrency(totalPartsCost)}
                </div>
              </div>
            )}
          </div>

          {/* Description and Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              maxLength="1000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the maintenance work performed..."
              required
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {formData.description.length}/1000 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
              maxLength="500"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes or comments..."
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {formData.notes.length}/500 characters
            </div>
          </div>

          {/* Status and Approval */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approved By *
              </label>
              <select
                name="approvedBy"
                value={formData.approvedBy}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Staff</option>
                {Array.isArray(staff) && staff.map(staffMember => (
                  <option key={staffMember._id} value={staffMember._id}>
                    {staffMember.firstName} {staffMember.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Verification */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="verified"
                  checked={formData.verified}
                  onChange={(e) => setFormData(prev => ({ ...prev, verified: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Verified
                </label>
              </div>
              {formData.verified && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verified By
                  </label>
                  <select
                    name="verifiedBy"
                    value={formData.verifiedBy}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Staff</option>
                    {Array.isArray(staff) && staff.map(staffMember => (
                      <option key={staffMember._id} value={staffMember._id}>
                        {staffMember.firstName} {staffMember.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {formData.status === 'completed' && (
              <div className="mt-3">
                <Input
                  label="Completion Date"
                  name="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>

          {/* Warranty Information */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                name="hasWarranty"
                checked={formData.warranty.hasWarranty}
                onChange={handleWarrantyChange}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-900">
                Has Warranty
              </label>
            </div>
            
            {formData.warranty.hasWarranty && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Warranty Period (months)"
                  name="warrantyPeriod"
                  type="number"
                  min="0"
                  value={formData.warranty.warrantyPeriod}
                  onChange={handleWarrantyChange}
                  placeholder="e.g., 12"
                />
                <Input
                  label="Warranty Details"
                  name="warrantyDetails"
                  value={formData.warranty.warrantyDetails}
                  onChange={handleWarrantyChange}
                  placeholder="Warranty terms"
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t">
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
              {editingMaintenance ? 'Update Record' : 'Add Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Part Modal */}
      <Modal
        isOpen={isPartsModalOpen}
        onClose={() => setIsPartsModalOpen(false)}
        closeOnBackdropClick={false}
        title="Add Part"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Part Name *"
            name="name"
            required
            value={partsFormData.name}
            onChange={handlePartsInputChange}
            placeholder="e.g., Brake Pads"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Part Number"
              name="partNumber"
              value={partsFormData.partNumber}
              onChange={handlePartsInputChange}
              placeholder="Part number"
            />
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              min="1"
              value={partsFormData.quantity}
              onChange={handlePartsInputChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Cost"
              name="unitCost"
              type="number"
              min="0"
              step="0.01"
              value={partsFormData.unitCost}
              onChange={handlePartsInputChange}
              placeholder="0.00"
            />
            <Input
              label="Total Cost"
              name="totalCost"
              type="number"
              min="0"
              step="0.01"
              value={partsFormData.totalCost}
              onChange={handlePartsInputChange}
              placeholder="0.00"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsPartsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={addPart}>
              Add Part
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Maintenance