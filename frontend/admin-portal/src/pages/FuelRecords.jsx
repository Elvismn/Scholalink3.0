import { useState, useEffect } from 'react'
import { Search, Plus, Fuel, Car, DollarSign, BarChart, Edit, Trash2, RefreshCw, Download, CheckCircle, XCircle, Calendar, MapPin } from 'lucide-react'
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
    location: '',
    receiptNumber: '',
    filledBy: '',
    fuelType: 'diesel',
    notes: '',
    verified: false
  })

  const fuelTypes = [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'premium', label: 'Premium' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Fuel Records - Fetching data...')
      const [recordsRes, vehiclesRes, staffRes] = await Promise.all([
        adminApi.getFuelRecords(),
        adminApi.getVehicles(),
        adminApi.getStaff()
      ])
      
      // Handle fuel records response - FIXED: Backend returns data.fuelRecords
      let fuelRecordsData = []
      if (recordsRes && recordsRes.data) {
        if (Array.isArray(recordsRes.data.fuelRecords)) {
          fuelRecordsData = recordsRes.data.fuelRecords
        } else if (Array.isArray(recordsRes.data)) {
          fuelRecordsData = recordsRes.data
        }
      }
      setFuelRecords(fuelRecordsData || [])
      
      // Handle vehicles response
      let vehiclesData = []
      if (vehiclesRes && vehiclesRes.data) {
        if (Array.isArray(vehiclesRes.data)) {
          vehiclesData = vehiclesRes.data
        } else if (Array.isArray(vehiclesRes)) {
          vehiclesData = vehiclesRes
        }
      }
      setVehicles(vehiclesData || [])
      
      // Handle staff response
      let staffData = []
      if (staffRes && staffRes.data) {
        if (Array.isArray(staffRes.data)) {
          staffData = staffRes.data
        } else if (Array.isArray(staffRes)) {
          staffData = staffRes
        }
      }
      setStaff(staffData || [])
      
      console.log('✅ Fuel Records - Data received:', fuelRecordsData.length, 'records')
    } catch (error) {
      console.error('❌ Fuel Records - Error fetching data:', error)
      showToast.error('Failed to load data', error.data?.message || error.message)
      setFuelRecords([])
      setVehicles([])
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Calculate total cost when liters or costPerLiter changes
    if (formData.liters && formData.costPerLiter) {
      const liters = parseFloat(formData.liters) || 0
      const costPerLiter = parseFloat(formData.costPerLiter) || 0
      const total = liters * costPerLiter
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
        totalCost: parseFloat(formData.totalCost) || 0,
        odometerReading: parseFloat(formData.odometerReading),
        station: formData.station.trim(),
        location: formData.location.trim(),
        receiptNumber: formData.receiptNumber.trim(),
        filledBy: formData.filledBy,
        fuelType: formData.fuelType,
        notes: formData.notes.trim(),
        verified: formData.verified
      }

      console.log('💾 Fuel Records - Saving record:', editingRecord ? 'update' : 'create')
      console.log('📋 Record data:', recordData)

      if (editingRecord) {
        await adminApi.updateFuelRecord(editingRecord._id, recordData)
        showToast.success('Fuel record updated successfully')
      } else {
        await adminApi.createFuelRecord(recordData)
        showToast.success('Fuel record created successfully')
      }
      
      setIsModalOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('❌ Fuel Records - Error saving record:', error)
      showToast.error('Operation failed', error.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      vehicle: '',
      date: new Date().toISOString().split('T')[0],
      liters: '',
      costPerLiter: '',
      totalCost: '',
      odometerReading: '',
      station: '',
      location: '',
      receiptNumber: '',
      filledBy: '',
      fuelType: 'diesel',
      notes: '',
      verified: false
    })
    setEditingRecord(null)
  }

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this fuel record?')) {
      try {
        console.log('🗑️ Fuel Records - Deleting record:', recordId)
        await adminApi.deleteFuelRecord(recordId)
        showToast.success('Fuel record deleted successfully')
        fetchData()
      } catch (error) {
        console.error('❌ Fuel Records - Error deleting record:', error)
        showToast.error('Failed to delete fuel record', error.data?.message || error.message)
      }
    }
  }

  const verifyRecord = async (recordId) => {
    try {
      console.log('✅ Fuel Records - Verifying record:', recordId)
      // Note: Backend has verifyRecord method but frontend adminApi might need this endpoint
      await adminApi.verifyFuelRecord(recordId)
      showToast.success('Fuel record verified successfully')
      fetchData()
    } catch (error) {
      console.error('❌ Fuel Records - Error verifying record:', error)
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
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const getVerificationStatus = (record) => {
    if (record.verified) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          <div className="text-sm">
            <div className="font-medium">Verified</div>
            {record.verifiedBy && (
              <div className="text-xs text-green-500">
                by {record.verifiedBy?.firstName} {record.verifiedBy?.lastName}
              </div>
            )}
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-yellow-600">
          <XCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Pending</span>
        </div>
      )
    }
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
              {vehicle?.plateNumber} • Odo: {(record.odometerReading || 0).toLocaleString()} km
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
            {date ? new Date(date).toLocaleDateString('en-GB') : 'N/A'}
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
            <span className="font-medium">{record.liters || 0} L</span>
            <span className="mx-2">•</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFuelTypeColor(record.fuelType)}`}>
              {record.fuelType?.charAt(0).toUpperCase() + record.fuelType?.slice(1)}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
            {record.station}
            {record.location && ` • ${record.location}`}
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
            {(record.costPerLiter || 0).toFixed(2)} KES/L
          </div>
        </div>
      )
    },
    {
      key: 'receipt',
      title: 'Receipt',
      render: (_, record) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 truncate max-w-xs">
            {record.receiptNumber || 'No receipt'}
          </div>
          <div className="text-gray-500">
            Filled by: {record.filledBy?.firstName} {record.filledBy?.lastName}
          </div>
        </div>
      )
    },
    {
      key: 'verified',
      title: 'Status',
      render: (_, record) => getVerificationStatus(record)
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
                location: record.location || '',
                receiptNumber: record.receiptNumber || '',
                filledBy: record.filledBy?._id || '',
                fuelType: record.fuelType || 'diesel',
                notes: record.notes || '',
                verified: record.verified || false
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
    const location = record.location?.toLowerCase() || ''
    const receipt = record.receiptNumber?.toLowerCase() || ''
    const filledByName = `${record.filledBy?.firstName || ''} ${record.filledBy?.lastName || ''}`.toLowerCase()
    
    const matchesSearch = searchTerm ? (
      vehicleInfo.includes(searchLower) ||
      station.includes(searchLower) ||
      location.includes(searchLower) ||
      receipt.includes(searchLower) ||
      filledByName.includes(searchLower)
    ) : true
    
    // Date filtering logic
    let matchesDate = true
    if (dateFilter !== 'all') {
      const recordDate = new Date(record.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      switch (dateFilter) {
        case 'today':
          const recordDay = new Date(recordDate)
          recordDay.setHours(0, 0, 0, 0)
          matchesDate = recordDay.getTime() === today.getTime()
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          matchesDate = recordDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          matchesDate = recordDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesDate
  })

  // Calculate statistics
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
              resetForm()
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
                placeholder="Search by vehicle, station, location, receipt, or staff..."
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
                  resetForm()
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
          resetForm()
        }}
        title={editingRecord ? 'Edit Fuel Record' : 'Add New Fuel Record'}
        size="lg"
        closeOnBackdropClick={false}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle *
              </label>
              <select
                required
                value={formData.vehicle}
                onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.make} {vehicle.model} ({vehicle.plateNumber})
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Date *"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Liters *"
              type="number"
              required
              min="0.1"
              step="0.1"
              placeholder="Fuel quantity"
              value={formData.liters}
              onChange={(e) => setFormData({...formData, liters: e.target.value})}
            />
            <Input
              label="Cost per Liter (KES) *"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="Price per liter"
              value={formData.costPerLiter}
              onChange={(e) => setFormData({...formData, costPerLiter: e.target.value})}
            />
            <Input
              label="Total Cost (KES) *"
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
              label="Odometer Reading (km) *"
              type="number"
              required
              min="0"
              placeholder="Current odometer"
              value={formData.odometerReading}
              onChange={(e) => setFormData({...formData, odometerReading: e.target.value})}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type *
              </label>
              <select
                required
                value={formData.fuelType}
                onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fuelTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fuel Station *"
              required
              placeholder="Station name"
              value={formData.station}
              onChange={(e) => setFormData({...formData, station: e.target.value})}
            />
            <Input
              label="Location"
              placeholder="Station location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            <Input
              label="Receipt Number"
              placeholder="Receipt/Invoice number"
              value={formData.receiptNumber}
              onChange={(e) => setFormData({...formData, receiptNumber: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filled By *
              </label>
              <select
                required
                value={formData.filledBy}
                onChange={(e) => setFormData({...formData, filledBy: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select staff member</option>
                {staff.map(staffMember => (
                  <option key={staffMember._id} value={staffMember._id}>
                    {staffMember.firstName || ''} {staffMember.lastName || ''} - {staffMember.position || 'Staff'}
                  </option>
                ))}
              </select>
            </div>
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
              Notes (Optional, max 500 chars)
            </label>
            <textarea
              rows="3"
              maxLength="500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this fuel record..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.notes.length}/500 characters
            </div>
          </div>

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
              {editingRecord ? 'Update Record' : 'Add Record'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default FuelRecords