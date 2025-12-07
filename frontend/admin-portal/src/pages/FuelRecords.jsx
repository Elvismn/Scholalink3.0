import { useState, useEffect } from 'react'
import { Search, Plus, Fuel, Car, DollarSign, BarChart, Edit, Trash2, RefreshCw, Download, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { Button, Modal, Input, Select, Table, Card, showToast, Loader } from '@shared'
import { adminApi } from '../services/adminApi'

const FuelRecords = () => {
  const [fuelRecords, setFuelRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [staff, setStaff] = useState([])
  const [formData, setFormData] = useState({
    vehicle: '',
    date: new Date().toISOString().split('T')[0],
    liters: '',
    costPerLiter: '',
    totalCost: '',
    odometerReading: '',
    station: '',
    fuelType: 'diesel',
    filledBy: '',
    verified: false,
    notes: ''
  })

  const fuelTypes = ['petrol', 'diesel', 'premium', 'other']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [recordsRes, vehiclesRes, staffRes] = await Promise.all([
        adminApi.getFuelRecords(),
        adminApi.getVehicles(),
        adminApi.getStaff()
      ])
      setFuelRecords(recordsRes.data || recordsRes || [])
      setVehicles(vehiclesRes.data || vehiclesRes || [])
      setStaff(staffRes.data || staffRes || [])
    } catch (error) {
      showToast.error('Failed to load data', error.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Calculate total cost when liters or costPerLiter changes
    if (formData.liters && formData.costPerLiter) {
      const total = parseFloat(formData.liters) * parseFloat(formData.costPerLiter)
      setFormData(prev => ({ ...prev, totalCost: total.toFixed(2) }))
    }
  }, [formData.liters, formData.costPerLiter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const recordData = {
        vehicle: formData.vehicle,
        date: formData.date,
        liters: parseFloat(formData.liters),
        costPerLiter: parseFloat(formData.costPerLiter),
        totalCost: parseFloat(formData.totalCost),
        odometerReading: parseFloat(formData.odometerReading),
        station: formData.station.trim(),
        fuelType: formData.fuelType,
        filledBy: formData.filledBy,
        verified: formData.verified,
        notes: formData.notes.trim()
      }

      if (editingRecord) {
        await adminApi.updateFuelRecord(editingRecord._id, recordData)
        showToast.success('Fuel record updated successfully')
      } else {
        await adminApi.createFuelRecord(recordData)
        showToast.success('Fuel record created successfully')
      }
      
      setIsModalOpen(false)
      setEditingRecord(null)
      resetFormData()
      fetchData()
    } catch (error) {
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetFormData = () => {
    setFormData({
      vehicle: '',
      date: new Date().toISOString().split('T')[0],
      liters: '',
      costPerLiter: '',
      totalCost: '',
      odometerReading: '',
      station: '',
      fuelType: 'diesel',
      filledBy: '',
      verified: false,
      notes: ''
    })
  }

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this fuel record?')) {
      try {
        await adminApi.deleteFuelRecord(recordId)
        showToast.success('Fuel record deleted successfully')
        fetchData()
      } catch (error) {
        showToast.error('Failed to delete fuel record', error.data?.message || error.message)
      }
    }
  }

  const verifyRecord = async (recordId) => {
    try {
      await adminApi.verifyFuelRecord(recordId)
      showToast.success('Fuel record verified successfully')
      fetchData()
    } catch (error) {
      showToast.error('Failed to verify record', error.data?.message || error.message)
    }
  }

  const getFuelTypeColor = (type) => {
    switch (type) {
      case 'diesel': return 'bg-gray-100 text-gray-800'
      case 'petrol': return 'bg-yellow-100 text-yellow-800'
      case 'premium': return 'bg-blue-100 text-blue-800'
      default: return 'bg-purple-100 text-purple-800'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const getVerificationStatus = (verified) => {
    return verified ? (
      <div className="flex items-center text-green-600">
        <CheckCircle className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">Verified</span>
      </div>
    ) : (
      <div className="flex items-center text-yellow-600">
        <XCircle className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">Pending</span>
      </div>
    )
  }

  const columns = [
    {
      key: 'vehicle',
      title: 'Vehicle',
      render: (vehicle, record) => (
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <Car className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {vehicle?.make} {vehicle?.model}
            </div>
            <div className="text-sm text-gray-500">
              {vehicle?.plateNumber} • Odo: {record.odometerReading?.toLocaleString()} km
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
          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
          <div className="text-gray-900">
            {new Date(date).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      key: 'fuelDetails',
      title: 'Fuel Details',
      render: (_, record) => (
        <div>
          <div className="flex items-center">
            <Fuel className="w-4 h-4 text-gray-400 mr-1" />
            <span className="font-medium">{record.liters} L</span>
            <span className="mx-2">•</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFuelTypeColor(record.fuelType)}`}>
              {record.fuelType}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
            {record.station}
          </div>
        </div>
      )
    },
    {
      key: 'cost',
      title: 'Cost',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">
            {formatCurrency(record.totalCost)}
          </div>
          <div className="text-sm text-gray-500">
            {record.costPerLiter?.toFixed(2)}/L
          </div>
        </div>
      )
    },
    {
      key: 'filledBy',
      title: 'Filled By',
      render: (staffMember) => (
        <div>
          <div className="font-medium text-gray-900">
            {staffMember?.firstName} {staffMember?.lastName}
          </div>
          <div className="text-xs text-gray-500">{staffMember?.position}</div>
        </div>
      )
    },
    {
      key: 'verified',
      title: 'Status',
      render: (verified) => getVerificationStatus(verified)
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex gap-2">
          {!record.verified && (
            <button
              onClick={() => verifyRecord(record._id)}
              className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
              title="Verify"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              setEditingRecord(record)
              setFormData({
                vehicle: record.vehicle?._id || '',
                date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                liters: record.liters?.toString() || '',
                costPerLiter: record.costPerLiter?.toString() || '',
                totalCost: record.totalCost?.toString() || '',
                odometerReading: record.odometerReading?.toString() || '',
                station: record.station || '',
                fuelType: record.fuelType || 'diesel',
                filledBy: record.filledBy?._id || '',
                verified: record.verified || false,
                notes: record.notes || ''
              })
              setIsModalOpen(true)
            }}
            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(record._id)}
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  const filteredRecords = fuelRecords.filter(record => {
    if (!searchTerm && dateFilter === 'all') return true
    
    const searchLower = searchTerm.toLowerCase()
    const vehicleInfo = `${record.vehicle?.make || ''} ${record.vehicle?.model || ''} ${record.vehicle?.plateNumber || ''}`.toLowerCase()
    const station = record.station?.toLowerCase() || ''
    
    const matchesSearch = searchTerm ? (
      vehicleInfo.includes(searchLower) ||
      station.includes(searchLower) ||
      record.filledBy?.firstName?.toLowerCase().includes(searchLower) ||
      record.filledBy?.lastName?.toLowerCase().includes(searchLower)
    ) : true
    
    // Date filtering logic
    let matchesDate = true
    if (dateFilter !== 'all') {
      const recordDate = new Date(record.date)
      const today = new Date()
      
      switch (dateFilter) {
        case 'today':
          matchesDate = recordDate.toDateString() === today.toDateString()
          break
        case 'week':
          const weekAgo = new Date(today.setDate(today.getDate() - 7))
          matchesDate = recordDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(today.setMonth(today.getMonth() - 1))
          matchesDate = recordDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesDate
  })

  const totalFuelCost = fuelRecords.reduce((sum, record) => sum + (record.totalCost || 0), 0)
  const totalFuelLiters = fuelRecords.reduce((sum, record) => sum + (record.liters || 0), 0)
  const averageCostPerLiter = totalFuelLiters > 0 ? totalFuelCost / totalFuelLiters : 0
  const verifiedRecords = fuelRecords.filter(r => r.verified).length
  const unverifiedRecords = fuelRecords.filter(r => !r.verified).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Records</h1>
          <p className="text-gray-600">Track and manage vehicle fuel consumption</p>
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
              setEditingRecord(null)
              resetFormData()
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Fuel Record
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Fuel className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold">{fuelRecords.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold">{formatCurrency(totalFuelCost)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Average Cost/L</p>
              <p className="text-2xl font-bold">KES {averageCostPerLiter.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold">{verifiedRecords}/{fuelRecords.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by vehicle, station, or staff..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' }
            ]}
          />
        </div>
      </Card>

      {/* Unverified Records Alert */}
      {unverifiedRecords > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Attention:</strong> You have {unverifiedRecords} unverified fuel record{unverifiedRecords !== 1 ? 's' : ''}. Please review and verify them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Records Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading fuel records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center">
            <Fuel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No fuel records found</p>
            {(searchTerm || dateFilter !== 'all') ? (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setDateFilter('all')
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={() => {
                  resetFormData()
                  setIsModalOpen(true)
                }}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Fuel Record
              </Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredRecords}
            keyField="_id"
            emptyMessage="No fuel records match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRecord(null)
          resetFormData()
        }}
        title={editingRecord ? 'Edit Fuel Record' : 'Add New Fuel Record'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Vehicle"
              required
              options={[
                { value: '', label: 'Select vehicle' },
                ...vehicles.map(vehicle => ({
                  value: vehicle._id,
                  label: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`
                }))
              ]}
              value={formData.vehicle}
              onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
            />
            <Input
              label="Date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Liters"
              type="number"
              required
              min="0.1"
              step="0.1"
              placeholder="Fuel quantity"
              value={formData.liters}
              onChange={(e) => setFormData({...formData, liters: e.target.value})}
            />
            <Input
              label="Cost per Liter (KES)"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="Price per liter"
              value={formData.costPerLiter}
              onChange={(e) => setFormData({...formData, costPerLiter: e.target.value})}
            />
            <Input
              label="Total Cost (KES)"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="Calculated automatically"
              value={formData.totalCost}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Odometer Reading (km)"
              type="number"
              required
              min="0"
              placeholder="Current odometer"
              value={formData.odometerReading}
              onChange={(e) => setFormData({...formData, odometerReading: e.target.value})}
            />
            <Select
              label="Fuel Type"
              required
              options={fuelTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }))}
              value={formData.fuelType}
              onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fuel Station"
              required
              placeholder="Station name"
              value={formData.station}
              onChange={(e) => setFormData({...formData, station: e.target.value})}
            />
            <Select
              label="Filled By"
              required
              options={[
                { value: '', label: 'Select staff member' },
                ...staff.map(staffMember => ({
                  value: staffMember._id,
                  label: `${staffMember.user?.firstName} ${staffMember.user?.lastName} - ${staffMember.position}`
                }))
              ]}
              value={formData.filledBy}
              onChange={(e) => setFormData({...formData, filledBy: e.target.value})}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="verified"
              checked={formData.verified}
              onChange={(e) => setFormData({...formData, verified: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
              Mark as verified
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this fuel record..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingRecord(null)
                resetFormData()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingRecord ? 'Update Record' : 'Add Record'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default FuelRecords